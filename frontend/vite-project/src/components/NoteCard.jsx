import { useState } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import {
  Eye, Heart, Download, Flag, Bookmark,
  Share2, FileText, X, Trash2
} from "lucide-react";
import {
  toggleLike, toggleBookmark, reportNote,
  incrementDownload, incrementView, deleteMyNote
} from "../services/notesService";
import toast from "react-hot-toast";

const SUBJECT_COLORS = {
  "Mathematics":        { bg: "bg-amber-50",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  "Physics":            { bg: "bg-blue-50",     text: "text-blue-700",    badge: "bg-blue-100 text-blue-700" },
  "Chemistry":          { bg: "bg-pink-50",     text: "text-pink-700",    badge: "bg-pink-100 text-pink-700" },
  "Computer Science":   { bg: "bg-green-50",    text: "text-green-700",   badge: "bg-green-100 text-green-700" },
  "Electronics":        { bg: "bg-violet-50",   text: "text-violet-700",  badge: "bg-violet-100 text-violet-700" },
  "Mechanical Engineering": { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  "Civil Engineering":  { bg: "bg-stone-50",    text: "text-stone-700",   badge: "bg-stone-100 text-stone-700" },
  "English":            { bg: "bg-teal-50",     text: "text-teal-700",    badge: "bg-teal-100 text-teal-700" },
  "default":            { bg: "bg-gray-50",     text: "text-gray-700",    badge: "bg-gray-100 text-gray-700" },
};

const REPORT_REASONS = [
  "Inappropriate content",
  "Vulgar images",
  "Spam",
  "Wrong subject / misleading",
  "Copyright violation",
  "Other",
];

export default function NoteCard({ note, onPreview, onDelete, showDelete = false }) {
  const { isSignedIn, user } = useUser();
  const [liked, setLiked] = useState(note?.likedBy?.includes(user?.id) || false);
  const [likeCount, setLikeCount] = useState(note?.likes || 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [viewCount, setViewCount] = useState(note?.views || 0);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const colors = SUBJECT_COLORS[note?.subject] || SUBJECT_COLORS["default"];

  const isOwner = showDelete && user?.id && note?.uploadedBy?.clerkId === user?.id;

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n.toString();
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const handleOpen = async () => {
  if (!isSignedIn) {
    const count = parseInt(localStorage.getItem("guestViews") || "0");
    if (count >= 3) {
      setShowGuestPopup(true);
      return;
    }
    localStorage.setItem("guestViews", count + 1);
    const remaining = 2 - count;
    if (remaining > 0) {
      toast(`${remaining} free view${remaining === 1 ? "" : "s"} remaining`, {
        icon: "👁",
      });
    }
  }
  try {
    await incrementView(note._id);
    setViewCount(prev => prev + 1);
    if (onPreview) onPreview(note);
    else window.open(note.fileUrl, "_blank");
  } catch {
    window.open(note.fileUrl, "_blank");
  }
};

  const handleDownload = async () => {
    try {
      await incrementDownload(note._id);
      window.open(note.fileUrl, "_blank");
      toast.success("Download started!");
    } catch {
      window.open(note.fileUrl, "_blank");
    }
  };

  const handleLike = async () => {
    if (!isSignedIn) { toast.error("Please sign in to like notes"); return; }
    try {
      const res = await toggleLike(note._id);
      setLiked(res.isLiked);
      setLikeCount(res.likes);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleBookmark = async () => {
    if (!isSignedIn) { toast.error("Please sign in to bookmark notes"); return; }
    try {
      const res = await toggleBookmark(note._id);
      setBookmarked(res.isBookmarked);
      toast.success(res.isBookmarked ? "Bookmarked!" : "Removed from bookmarks");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/dashboard`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = async (reason) => {
    if (!isSignedIn) { toast.error("Please sign in to report notes"); return; }
    try {
      setReporting(true);
      await reportNote(note._id, reason);
      toast.success("Note reported successfully");
      setShowReport(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setReporting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteMyNote(note._id);
      toast.success("Note deleted successfully");
      setDeleted(true);
      onDelete?.(note._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete note");
    }
  };

  if (deleted) return null;
  if (showGuestPopup) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye size={28} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          You've used your 3 free views!
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Sign in to continue reading unlimited notes for free.
        </p>
        <div className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full transition-colors">
              Sign in to continue
            </button>
          </SignInButton>
          <button
            onClick={() => setShowGuestPopup(false)}
            className="w-full border border-gray-200 text-gray-500 font-medium py-3 rounded-full hover:bg-gray-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200 flex flex-col relative">

      <div
        className={`${colors.bg} h-28 flex items-center justify-center relative cursor-pointer`}
        onClick={handleOpen}
      >
        <FileText size={36} className={`${colors.text} opacity-60`} />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {note?.subject || "General"}
        </span>
        {note?.semester && (
          <span className="absolute top-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">
            Sem {note.semester}
          </span>
        )}
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="absolute bottom-3 right-3 bg-red-50 text-red-500 hover:bg-red-100 p-1.5 rounded-full transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer"
          onClick={handleOpen}
        >
          {note?.title || "Untitled Note"}
        </h3>

        <p className="text-xs text-gray-500 mb-2">
          by{" "}
          <span className="font-bold text-gray-800 text-sm">
            {note?.uploadedBy?.fullName || "Anonymous"}
          </span>
          {" "}· {timeAgo(note?.createdAt)}
        </p>

        {note?.branch && (
          <p className="text-xs text-gray-400 mb-3">{note.branch}</p>
        )}

        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={12} /> {formatCount(viewCount)}
          </span>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
          >
            <Heart size={12} fill={liked ? "currentColor" : "none"} />
            {formatCount(likeCount)}
          </button>

          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Download size={12} /> {formatCount(note?.downloads)}
          </span>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleBookmark}
              className={`p-1 transition-colors ${bookmarked ? "text-orange-500" : "text-gray-300 hover:text-orange-400"}`}
            >
              <Bookmark size={13} fill={bookmarked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={handleShare}
              className="p-1 text-gray-300 hover:text-blue-400 transition-colors"
            >
              <Share2 size={13} />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2.5 py-1 rounded-full transition-colors font-medium"
            >
              <Download size={11} /> Get
            </button>

            <div className="relative">
              <button
                onClick={() => setShowReport(!showReport)}
                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Flag size={12} />
              </button>

              {showReport && (
                <div className="absolute right-0 bottom-8 bg-white border border-gray-100 rounded-xl shadow-lg p-3 w-52 z-20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Report this note</p>
                    <button onClick={() => setShowReport(false)} className="text-gray-300 hover:text-gray-500">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason}
                        disabled={reporting}
                        onClick={() => handleReport(reason)}
                        className="block w-full text-left text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}