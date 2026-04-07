import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, FileText, Users, Flag, Trash2, UserX, UserCheck,
  X, Shield, LogOut, RefreshCw, TrendingUp, Eye, Download,
  Heart, Clock, Search, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle, Activity, BookOpen, Star, MoreVertical, Filter,
  ArrowUpRight, ArrowDownRight, Database, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import API from "../utils/api";
import toast from "react-hot-toast";

/* ─── helpers ─────────────────────────────────────────── */
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const fmt = (n) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}K`
    : String(n ?? 0);

const TABS = [
  { key: "overview",  label: "Overview",       icon: Activity },
  { key: "analytics", label: "Analytics",      icon: TrendingUp },
  { key: "notes",     label: "All Notes",      icon: FileText },
  { key: "reported",  label: "Reported",       icon: Flag },
  { key: "users",     label: "Users",          icon: Users },
];

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#fef3c7"];

/* ─── StatCard ─────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, bg, trend, trendUp }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-green-500" : "text-red-400"}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-black ${color} mb-0.5`}>{fmt(value)}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}

/* ─── main component ─────────────────────────────────── */
export default function AdminPanel() {
  const navigate = useNavigate();
  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem("adminUser") || "{}"); }
    catch { return {}; }
  })();

  const [activeTab, setActiveTab]   = useState("overview");
  const [stats, setStats]           = useState(null);
  const [analytics, setAnalytics]   = useState(null);
  const [reportedNotes, setReported]= useState([]);
  const [allNotes, setAllNotes]     = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setStatus]   = useState("all");
  const [noteSearch, setNoteSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  /* ─── auth guard ─────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); }
  }, [navigate]);

  /* ─── fetch helpers ─────────────────── */
  const adminAPI = useCallback(async (method, url, data) => {
    const token = localStorage.getItem("adminToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    if (method === "get") return API.get(url, config);
    if (method === "delete") return API.delete(url, config);
    if (method === "patch") return API.patch(url, data, config);
    if (method === "post") return API.post(url, data, config);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI("get", "/admin/stats");
      setStats(res.data.stats);
    } catch { toast.error("Failed to load stats"); }
    finally { setLoading(false); }
  }, [adminAPI]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI("get", "/admin/analytics");
      setAnalytics(res.data);
    } catch { toast.error("Failed to load analytics"); }
    finally { setLoading(false); }
  }, [adminAPI]);

  const fetchReported = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI("get", "/admin/reported");
      setReported(res.data.notes);
    } catch { toast.error("Failed to load reported notes"); }
    finally { setLoading(false); }
  }, [adminAPI]);

  const fetchAllNotes = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const res = await adminAPI("get", `/admin/notes?page=${p}&limit=15&search=${q}`);
      setAllNotes(res.data.notes);
      setTotalPages(res.data.totalPages);
    } catch { toast.error("Failed to load notes"); }
    finally { setLoading(false); }
  }, [adminAPI]);

  const fetchAllUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI("get", `/admin/users?page=${p}&limit=15`);
      setAllUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, [adminAPI]);

  useEffect(() => {
    if (activeTab === "overview")  { fetchStats(); }
    if (activeTab === "analytics") { fetchAnalytics(); fetchStats(); }
    if (activeTab === "reported")  { fetchReported(); }
    if (activeTab === "notes")     { setPage(1); fetchAllNotes(1, noteSearch); }
    if (activeTab === "users")     { setPage(1); fetchAllUsers(1); }
  }, [activeTab]);

  /* auto-refresh every 30s */
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (activeTab === "overview") fetchStats();
      if (activeTab === "analytics") fetchAnalytics();
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, activeTab, fetchStats, fetchAnalytics]);

  /* ─── actions ─────────────────────── */
  const handleDeleteNote = async (id) => {
    if (!window.confirm("Permanently delete this note?")) return;
    try {
      await adminAPI("delete", `/admin/notes/${id}`);
      toast.success("Note deleted");
      setReported((p) => p.filter((n) => n._id !== id));
      setAllNotes((p) => p.filter((n) => n._id !== id));
    } catch { toast.error("Delete failed"); }
  };

  const handleClearReports = async (id) => {
    try {
      await adminAPI("patch", `/admin/notes/${id}/clear-reports`);
      toast.success("Reports cleared");
      setReported((p) => p.filter((n) => n._id !== id));
    } catch { toast.error("Failed to clear reports"); }
  };

  const handleToggleUser = async (u) => {
    const endpoint = u.isActive ? "deactivate" : "reactivate";
    if (u.isActive && !window.confirm(`Block ${u.fullName}?`)) return;
    try {
      await adminAPI("patch", `/admin/users/${u._id}/${endpoint}`);
      toast.success(u.isActive ? "User blocked" : "User unblocked");
      setAllUsers((p) => p.map((x) => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast.error("Action failed"); }
  };

  const handlePromoteUser = async (u) => {
    const newRole = u.role === "admin" ? "student" : "admin";
    if (!window.confirm(`Change ${u.fullName}'s role to ${newRole}?`)) return;
    try {
      await adminAPI("patch", `/admin/users/${u._id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setAllUsers((p) => p.map((x) => x._id === u._id ? { ...x, role: newRole } : x));
    } catch { toast.error("Role update failed"); }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.fullName} and all their notes?`)) return;
    try {
      await adminAPI("delete", `/admin/users/${u._id}`);
      toast.success("User deleted");
      setAllUsers((p) => p.filter((x) => x._id !== u._id));
    } catch { toast.error("Delete failed"); }
  };

  const handleApproveNote = async (id) => {
    try {
      await adminAPI("patch", `/admin/notes/${id}/approve`);
      toast.success("Note approved");
      setAllNotes((p) => p.map((n) => n._id === id ? { ...n, isApproved: true } : n));
    } catch { toast.error("Approve failed"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  /* ─── filtered data ─────────────────── */
  const filteredUsers = allUsers.filter((u) => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all"
      || (filterStatus === "active" && u.isActive)
      || (filterStatus === "blocked" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  /* ─── render ────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Sidebar ── */}
      <div className="fixed inset-y-0 left-0 w-60 bg-[#0f0f14] flex flex-col z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">NoteNest</p>
            <p className="text-gray-600 text-[10px]">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />
              {label}
              {key === "reported" && reportedNotes.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {reportedNotes.length > 9 ? "9+" : reportedNotes.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {adminUser?.profileImage
                ? <img src={adminUser.profileImage} alt="" className="w-full h-full object-cover" />
                : adminUser?.fullName?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{adminUser?.fullName || "Admin"}</p>
              <p className="text-gray-600 text-[10px] truncate">{adminUser?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="ml-60 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 capitalize">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-400">Real-time data from MongoDB</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                autoRefresh ? "bg-green-50 text-green-600 border-green-200" : "text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Zap size={11} />
              {autoRefresh ? "Live" : "Auto-refresh"}
            </button>
            <button
              onClick={() => {
                if (activeTab === "overview") fetchStats();
                else if (activeTab === "analytics") fetchAnalytics();
                else if (activeTab === "reported") fetchReported();
                else if (activeTab === "notes") fetchAllNotes(page, noteSearch);
                else if (activeTab === "users") fetchAllUsers(page);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* ════════════ OVERVIEW ════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {loading && !stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : stats && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Total Notes"     value={stats.totalNotes}     icon={BookOpen}  color="text-blue-500"   bg="bg-blue-50"   trend={stats.notesTrend}     trendUp />
                    <StatCard label="Total Users"     value={stats.totalUsers}     icon={Users}     color="text-green-500"  bg="bg-green-50"  trend={stats.usersTrend}     trendUp />
                    <StatCard label="Reported Notes"  value={stats.totalReported}  icon={Flag}      color="text-red-500"    bg="bg-red-50" />
                    <StatCard label="Total Views"     value={stats.totalViews}     icon={Eye}       color="text-purple-500" bg="bg-purple-50" />
                    <StatCard label="Total Downloads" value={stats.totalDownloads} icon={Download}  color="text-orange-500" bg="bg-orange-50" />
                    <StatCard label="Total Likes"     value={stats.totalLikes}     icon={Heart}     color="text-pink-500"   bg="bg-pink-50" />
                  </div>

                  {/* Quick insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={15} className="text-orange-500" />
                        <p className="text-sm font-semibold text-gray-700">Top Subjects</p>
                      </div>
                      {(stats.topSubjects || []).map((s, i) => (
                        <div key={i} className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-600 truncate flex-1">{s._id || "Unknown"}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, (s.count / (stats.topSubjects[0]?.count || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-5 text-right">{s.count}</span>
                          </div>
                        </div>
                      ))}
                      {!stats.topSubjects?.length && <p className="text-xs text-gray-400">No data</p>}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Star size={15} className="text-amber-500" />
                        <p className="text-sm font-semibold text-gray-700">Top Notes by Likes</p>
                      </div>
                      {(stats.topNotes || []).slice(0, 4).map((n, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2.5">
                          <span className="text-xs text-gray-300 font-bold w-4">{i + 1}</span>
                          <p className="text-xs text-gray-700 flex-1 truncate">{n.title}</p>
                          <span className="text-xs text-pink-500 font-semibold">{n.likes}♥</span>
                        </div>
                      ))}
                      {!stats.topNotes?.length && <p className="text-xs text-gray-400">No data</p>}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock size={15} className="text-blue-500" />
                        <p className="text-sm font-semibold text-gray-700">Recent Activity</p>
                      </div>
                      {(stats.recentActivity || []).map((a, i) => (
                        <div key={i} className="flex items-start gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-700">{a.message}</p>
                            <p className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                      {!stats.recentActivity?.length && <p className="text-xs text-gray-400">No recent activity</p>}
                    </div>
                  </div>

                  {/* Branch distribution */}
                  {stats.branchDistribution?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Notes by Branch</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.branchDistribution} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" }} />
                          <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════ ANALYTICS ════════════ */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Uploads over time */}
                  {analytics?.uploadsOverTime && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-bold text-gray-800">Note Uploads Over Time</p>
                          <p className="text-xs text-gray-400">Last 30 days</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full">
                          <ArrowUpRight size={11} /> Growing
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={analytics.uploadsOverTime}>
                          <defs>
                            <linearGradient id="gradNotes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f3f4f6" }} />
                          <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#gradNotes)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Users over time */}
                    {analytics?.usersOverTime && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-sm font-bold text-gray-800 mb-1">User Registrations</p>
                        <p className="text-xs text-gray-400 mb-4">Last 30 days</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={analytics.usersOverTime}>
                            <defs>
                              <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fill="url(#gradUsers)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Note type breakdown */}
                    {analytics?.noteTypeBreakdown && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-sm font-bold text-gray-800 mb-1">Note Types</p>
                        <p className="text-xs text-gray-400 mb-4">Distribution</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={analytics.noteTypeBreakdown}
                              dataKey="count"
                              nameKey="_id"
                              cx="50%"
                              cy="50%"
                              outerRadius={65}
                              innerRadius={35}
                              paddingAngle={3}
                            >
                              {analytics.noteTypeBreakdown.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Engagement stats */}
                  {analytics?.engagementStats && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <p className="text-sm font-bold text-gray-800 mb-4">Engagement per Semester</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.engagementStats} barSize={18}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="_id" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="views" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Views" />
                          <Bar dataKey="downloads" fill="#f97316" radius={[3, 3, 0, 0]} name="Downloads" />
                          <Bar dataKey="likes" fill="#fb7185" radius={[3, 3, 0, 0]} name="Likes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Summary cards */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Avg Views/Note",     val: stats.totalNotes ? Math.round(stats.totalViews / stats.totalNotes) : 0, icon: Eye,      color: "text-purple-500", bg: "bg-purple-50" },
                        { label: "Avg Downloads/Note", val: stats.totalNotes ? Math.round(stats.totalDownloads / stats.totalNotes) : 0, icon: Download, color: "text-orange-500", bg: "bg-orange-50" },
                        { label: "Avg Likes/Note",     val: stats.totalNotes ? Math.round(stats.totalLikes / stats.totalNotes) : 0, icon: Heart,    color: "text-pink-500",   bg: "bg-pink-50" },
                        { label: "Notes per User",     val: stats.totalUsers ? (stats.totalNotes / stats.totalUsers).toFixed(1) : 0, icon: Database,  color: "text-blue-500",   bg: "bg-blue-50" },
                      ].map(({ label, val, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                          <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                            <Icon size={14} className={color} />
                          </div>
                          <p className={`text-xl font-black ${color}`}>{val}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════ ALL NOTES ════════════ */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Search + filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchAllNotes(1, noteSearch)}
                    placeholder="Search notes by title or subject..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>
                <button
                  onClick={() => fetchAllNotes(1, noteSearch)}
                  className="px-4 py-2.5 bg-orange-500 text-white text-sm rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Search
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Title", "Subject / Branch", "Uploader", "Stats", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        [...Array(8)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(6)].map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : allNotes.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No notes found</td></tr>
                      ) : allNotes.map((note) => (
                        <tr key={note._id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3 max-w-xs">
                            <p className="font-semibold text-gray-900 text-xs line-clamp-1">{note.title}</p>
                            <p className="text-[10px] text-gray-400">{timeAgo(note.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700">{note.subject}</p>
                            <p className="text-[10px] text-gray-400">{note.branch} · Sem {note.semester}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700">{note.uploadedBy?.fullName || "Unknown"}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-28">{note.uploadedBy?.email}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2 text-[10px]">
                              <span className="flex items-center gap-0.5 text-purple-500"><Eye size={9} />{fmt(note.viewedBy?.length)}</span>
                              <span className="flex items-center gap-0.5 text-orange-500"><Download size={9} />{fmt(note.downloads)}</span>
                              <span className="flex items-center gap-0.5 text-pink-500"><Heart size={9} />{fmt(note.likes)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit ${note.isApproved ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                                {note.isApproved ? "Approved" : "Pending"}
                              </span>
                              {note.reports?.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500 w-fit">
                                  {note.reports.length} report{note.reports.length > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {!note.isApproved && (
                                <button onClick={() => handleApproveNote(note._id)} title="Approve" className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                                  <CheckCircle size={13} />
                                </button>
                              )}
                              <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" title="View file" className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <Eye size={13} />
                              </a>
                              <button onClick={() => handleDeleteNote(note._id)} title="Delete" className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                    <div className="flex gap-1">
                      <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchAllNotes(page - 1, noteSearch); }} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-all">
                        <ChevronLeft size={14} />
                      </button>
                      <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); fetchAllNotes(page + 1, noteSearch); }} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-all">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ REPORTED NOTES ════════════ */}
          {activeTab === "reported" && (
            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)
              ) : reportedNotes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-green-400" />
                  </div>
                  <p className="text-gray-700 font-semibold">All clear!</p>
                  <p className="text-sm text-gray-400 mt-1">No reported notes at the moment</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <AlertTriangle size={13} className="text-red-500" />
                    <p className="text-xs text-red-600 font-medium">{reportedNotes.length} note{reportedNotes.length > 1 ? "s" : ""} flagged for review</p>
                  </div>
                  {reportedNotes.map((note) => (
                    <div key={note._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                          <Flag size={15} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 text-sm">{note.title}</h3>
                            <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                              {note.reportCount} report{note.reportCount > 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">
                            {note.subject} · {note.branch} Sem {note.semester} · by <span className="font-medium text-gray-600">{note.uploadedBy?.fullName}</span> · {timeAgo(note.createdAt)}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {note.reports?.map((r, i) => (
                              <span key={i} className="bg-gray-50 text-gray-500 text-[10px] px-2.5 py-1 rounded-lg border border-gray-100">
                                {r.reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors border border-blue-100">
                            <Eye size={10} /> View
                          </a>
                          <button onClick={() => handleClearReports(note._id)} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-200">
                            <X size={10} /> Dismiss
                          </button>
                          <button onClick={() => handleDeleteNote(note._id)} className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors border border-red-100">
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ════════════ USERS ════════════ */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                  <Filter size={12} className="text-gray-400 ml-2" />
                  {["all", "student", "admin"].map((r) => (
                    <button key={r} onClick={() => setFilterRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterRole === r ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-700"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                  {["all", "active", "blocked"].map((s) => (
                    <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-700"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        [...Array(8)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(6)].map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No users found</td></tr>
                      ) : filteredUsers.map((u) => (
                        <tr key={u._id} className={`hover:bg-gray-50/70 transition-colors ${!u.isActive ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-700 text-xs font-bold overflow-hidden shrink-0">
                                {u.profileImage
                                  ? <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                  : u.fullName?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{u.fullName}</p>
                                <p className="text-[10px] text-gray-400">{u.bookmarks?.length || 0} bookmarks</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-500 max-w-40 truncate">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.role === "admin" ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-500"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                              {u.isActive ? "Active" : "Blocked"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-400">{timeAgo(u.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {/* Block / Unblock */}
                              <button
                                onClick={() => handleToggleUser(u)}
                                title={u.isActive ? "Block user" : "Unblock user"}
                                className={`p-1.5 rounded-lg transition-all ${u.isActive ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-green-400 hover:text-green-600 hover:bg-green-50"}`}
                              >
                                {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                              </button>
                              {/* Promote / Demote */}
                              <button
                                onClick={() => handlePromoteUser(u)}
                                title={u.role === "admin" ? "Revoke admin" : "Make admin"}
                                className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              >
                                <Shield size={13} />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                    <div className="flex gap-1">
                      <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchAllUsers(page - 1); }} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-all">
                        <ChevronLeft size={14} />
                      </button>
                      <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); fetchAllUsers(page + 1); }} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-all">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
