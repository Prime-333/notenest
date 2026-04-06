import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import {
  Search, Upload, Star, BookOpen, Users,
  Download, Shield, ArrowRight, TrendingUp, Bookmark
} from "lucide-react";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import { getTrendingNotes } from "../services/notesService";

const SUBJECTS = [
  "All", "Chemistry", "Civil Engineering", "Computer Science",
  "Data Structures", "Digital Electronics", "Electrical Engineering",
  "Electronics", "English", "Mathematics", "Mechanical Engineering",
  "Operating Systems", "Physics", "Software Engineering"
];

const FEATURES = [
  {
    icon: Upload,
    color: "bg-orange-50 text-orange-500",
    title: "Easy upload",
    desc: "Upload handwritten PDFs in seconds. Stored securely on Google Drive."
  },
  {
    icon: Search,
    color: "bg-blue-50 text-blue-500",
    title: "Smart search",
    desc: "Filter by subject, semester, branch and find exactly what you need."
  },
  {
    icon: Star,
    color: "bg-yellow-50 text-yellow-500",
    title: "Like & save",
    desc: "Like helpful notes and bookmark them to your profile for later."
  },
  {
    icon: Users,
    color: "bg-green-50 text-green-500",
    title: "Community driven",
    desc: "Built by students, for students. Open and free for everyone."
  },
  {
    icon: Download,
    color: "bg-purple-50 text-purple-500",
    title: "Free downloads",
    desc: "Download any note instantly — no paywalls, no subscriptions."
  },
  {
    icon: Shield,
    color: "bg-red-50 text-red-500",
    title: "Report system",
    desc: "Keep quality high with community reporting for bad content."
  },
];

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trendingNotes, setTrendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingNotes();
        setTrendingNotes(data?.notes || []);
      } catch {
        setTrendingNotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-blue-50" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-orange-100">
            <Star size={12} fill="currentColor" />
            Open source · Free forever
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight mb-5">
            Share knowledge,{" "}
            <span className="text-orange-500">learn together.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your handwritten notes and access thousands of study
            materials shared by students and teachers worldwide.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 max-w-lg mx-auto bg-white border border-gray-200 rounded-full px-5 py-3 mb-8 shadow-sm focus-within:border-orange-400 transition-all"
          >
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes by subject, topic..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-full transition-colors text-sm"
            >
              Explore notes <ArrowRight size={15} />
            </Link>
            {isSignedIn ? (
              <Link
                to="/upload"
                className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-full transition-colors text-sm bg-white"
              >
                <Upload size={15} /> Upload yours
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-full transition-colors text-sm bg-white">
                  <Upload size={15} /> Upload yours
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </section>

      {/* SUBJECT PILLS */}
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Browse by subject
        </h2>
        <div className="flex gap-2 flex-wrap">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() =>
                navigate(
                  s === "All"
                    ? "/dashboard"
                    : `/dashboard?subject=${encodeURIComponent(s)}`
                )
              }
              className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* TRENDING NOTES - 3 columns */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-red-400" />
            <h2 className="text-xl font-bold text-gray-900">Trending notes</h2>
          </div>
          <Link
            to="/dashboard"
            className="text-sm text-orange-500 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-52 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : trendingNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingNotes.slice(0, 6).map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No notes yet. Be the first to upload!
            </p>
            <Link
              to="/upload"
              className="inline-block mt-4 text-sm text-orange-500 font-medium hover:underline"
            >
              Upload now →
            </Link>
          </div>
        )}
      </div>

      {/* FEATURES - bigger icons */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Why NoteNest?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-100 hover:shadow-sm transition-all"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${color}`}
              >
                <Icon size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-orange-500 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to share your notes?
          </h2>
          <p className="text-orange-100 text-sm mb-7 max-w-md mx-auto">
            Join thousands of students already sharing knowledge on NoteNest.
            It's free, open, and always will be.
          </p>
          {isSignedIn ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-7 py-3 rounded-full hover:bg-orange-50 transition-colors text-sm"
            >
              Upload your notes <ArrowRight size={15} />
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-7 py-3 rounded-full hover:bg-orange-50 transition-colors text-sm">
                Get started for free <ArrowRight size={15} />
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="font-bold text-gray-900">
            Note<span className="text-orange-500">Nest</span>
          </div>
          <p>Open source · Free forever · Built with React + Node.js</p>
          <div className="flex gap-5">
            <Link to="/dashboard" className="hover:text-gray-600">Browse</Link>
            <Link to="/upload" className="hover:text-gray-600">Upload</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}