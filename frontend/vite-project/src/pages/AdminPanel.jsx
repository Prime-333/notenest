import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, FileText, Users, Flag,
  Trash2, UserX, UserCheck, X, Shield
} from "lucide-react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import toast from "react-hot-toast";

const TABS = [
  { key: "stats",    label: "Dashboard",      icon: BarChart2 },
  { key: "reported", label: "Reported Notes",  icon: Flag },
  { key: "notes",    label: "All Notes",       icon: FileText },
  { key: "users",    label: "All Users",       icon: Users },
];

export default function AdminPanel() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats]         = useState(null);
  const [reportedNotes, setReportedNotes] = useState([]);
  const [allNotes, setAllNotes]   = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!isSignedIn) { navigate("/"); return; }
    fetchStats();
  }, [isSignedIn]);

  useEffect(() => {
    if (activeTab === "stats")    fetchStats();
    if (activeTab === "reported") fetchReported();
    if (activeTab === "notes")    fetchAllNotes();
    if (activeTab === "users")    fetchAllUsers();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data.stats);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchReported = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/reported");
      setReportedNotes(res.data.notes);
    } catch {
      toast.error("Failed to load reported notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNotes = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/notes");
      setAllNotes(res.data.notes);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setAllUsers(res.data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await API.delete(`/admin/notes/${noteId}`);
      toast.success("Note deleted successfully");
      setReportedNotes((prev) => prev.filter((n) => n._id !== noteId));
      setAllNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleClearReports = async (noteId) => {
    try {
      await API.patch(`/admin/notes/${noteId}/clear-reports`);
      toast.success("Reports cleared");
      setReportedNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch {
      toast.error("Failed to clear reports");
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await API.patch(`/admin/users/${userId}/deactivate`);
      toast.success("User deactivated");
      setAllUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isActive: false } : u)
      );
    } catch {
      toast.error("Failed to deactivate user");
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await API.patch(`/admin/users/${userId}/reactivate`);
      toast.success("User reactivated");
      setAllUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isActive: true } : u)
      );
    } catch {
      toast.error("Failed to reactivate user");
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  if (!isSignedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Shield size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400">NoteNest control center</p>
          </div>
        </div>

        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 mb-8 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {!loading && activeTab === "stats" && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Total Notes",     val: stats.totalNotes,     color: "text-blue-500",   bg: "bg-blue-50" },
              { label: "Total Users",     val: stats.totalUsers,     color: "text-green-500",  bg: "bg-green-50" },
              { label: "Reported Notes",  val: stats.totalReported,  color: "text-red-500",    bg: "bg-red-50" },
              { label: "Total Views",     val: stats.totalViews,     color: "text-purple-500", bg: "bg-purple-50" },
              { label: "Total Downloads", val: stats.totalDownloads, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Total Likes",     val: stats.totalLikes,     color: "text-pink-500",   bg: "bg-pink-50" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <BarChart2 size={18} className={color} />
                </div>
                <p className={`text-2xl font-bold ${color} mb-1`}>
                  {val?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "reported" && (
          <div className="space-y-4">
            {reportedNotes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Flag size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No reported notes</p>
                <p className="text-sm text-gray-400">Everything looks clean!</p>
              </div>
            ) : (
              reportedNotes.map((note) => (
                <div
                  key={note._id}
                  className="bg-white rounded-2xl border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {note.title}
                        </h3>
                        <span className="bg-red-50 text-red-500 text-xs px-2 py-0.5 rounded-full font-medium">
                          {note.reportCount} reports
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {note.subject} · Sem {note.semester} · by {note.uploadedBy?.fullName} · {timeAgo(note.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.reports?.slice(0, 5).map((r, i) => (
                          <span
                            key={i}
                            className="bg-gray-50 text-gray-500 text-xs px-2 py-1 rounded-lg border border-gray-100"
                          >
                            {r.reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleClearReports(note._id)}
                        className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                      >
                        <X size={11} /> Clear reports
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors border border-red-100"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "notes" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploader</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stats</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allNotes.map((note) => (
                  <tr key={note._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs line-clamp-1 max-w-xs">
                        {note.title}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(note.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{note.subject}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {note.uploadedBy?.fullName || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">
                        {note.views}v · {note.likes}l · {note.downloads}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-semibold overflow-hidden">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.fullName?.[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {u.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{u.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "admin"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-gray-50 text-gray-500"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <button
                          onClick={() => handleDeactivate(u._id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <UserX size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(u._id)}
                          className="text-green-400 hover:text-green-600 transition-colors"
                        >
                          <UserCheck size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}