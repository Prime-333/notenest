import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Upload, Download, Eye, Bookmark } from "lucide-react";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import { getMyNotes, getBookmarkedNotes } from "../services/notesService";

const TABS = [
  { key: "uploaded",   label: "My Notes",        icon: Upload },
  { key: "bookmarked", label: "Bookmarked Notes", icon: Bookmark },
];

export default function UserProfile() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState("uploaded");
  const [uploadedNotes, setUploadedNotes]     = useState([]);
  const [bookmarkedNotes, setBookmarkedNotes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({
    uploads: 0, totalViews: 0, totalDownloads: 0, totalLikes: 0,
  });

  useEffect(() => {
    if (!isSignedIn) { navigate("/"); return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [uploaded, bookmarked] = await Promise.all([
          getMyNotes(),
          getBookmarkedNotes(),
        ]);

        const notes = uploaded?.notes || [];
        setUploadedNotes(notes);
        setBookmarkedNotes(bookmarked?.notes || []);
        setStats({
          uploads:        notes.length,
          totalViews:     notes.reduce((s, n) => s + (n.views     || 0), 0),
          totalDownloads: notes.reduce((s, n) => s + (n.downloads || 0), 0),
          totalLikes:     notes.reduce((s, n) => s + (n.likes     || 0), 0),
        });
      } catch {
        setUploadedNotes([]);
        setBookmarkedNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, navigate]);

  const formatNum = (n) =>
    n >= 1000 ? (n / 1000).toFixed(1) + "k" : n?.toString() || "0";

  const displayNotes = activeTab === "uploaded" ? uploadedNotes : bookmarkedNotes;

  if (!isSignedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-2xl overflow-hidden border-4 border-white shadow-sm shrink-0">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.firstName?.[0]?.toUpperCase() || "U"
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">
              {user?.fullName || "User"}
            </h1>
            <p className="text-sm text-gray-400 mb-4">
              {user?.primaryEmailAddress?.emailAddress}
            </p>

            <div className="flex gap-5 flex-wrap">
              {[
                { icon: Upload,   label: "Uploads",   val: stats.uploads },
                { icon: Eye,      label: "Views",     val: formatNum(stats.totalViews) },
                { icon: Download, label: "Downloads", val: formatNum(stats.totalDownloads) },
                { icon: Heart,    label: "Likes",     val: formatNum(stats.totalLikes) },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {val}
                    </p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/upload")}
            className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            <Upload size={14} /> Upload notes
          </button>
        </div>

        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 mb-6 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={13} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === key
                  ? "bg-orange-400 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {key === "uploaded" ? uploadedNotes.length : bookmarkedNotes.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : displayNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayNotes.map((note) => (
              <NoteCard key={note._id} note={note} showDelete={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
            {activeTab === "uploaded" ? (
              <>
                <p className="text-gray-500 font-medium mb-1">
                  No notes uploaded yet
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Share your first set of notes with the community!
                </p>
                <button
                  onClick={() => navigate("/upload")}
                  className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
                >
                  <Upload size={14} /> Upload notes
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium mb-1">
                  No bookmarked notes yet
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  Browse notes and bookmark the ones you find helpful!
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
                >
                  Browse notes
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}