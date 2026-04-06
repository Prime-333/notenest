import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import { getAllNotes } from "../services/notesService";

const SUBJECTS = [
  "All", "Algorithms", "Artificial Intelligence", "Chemistry",
  "Civil Engineering", "Computer Networks", "Computer Science",
  "Data Structures", "Database Management", "Digital Electronics",
  "Electrical Engineering", "Electronics", "English",
  "Fluid Mechanics", "Java Programming", "Machine Learning",
  "Mathematics", "Mechanical Engineering", "Microprocessors",
  "Operating Systems", "Physics", "Python Programming",
  "Software Engineering", "Thermodynamics", "Web Technology"
];

const BRANCHES = [
  "All", "Civil Engineering", "Computer Engineering",
  "Electrical Engineering", "Electronics Engineering",
  "Information Technology", "Mechanical Engineering"
];

const SEMESTERS = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];

const NOTE_TYPES = [
  "All", "Article", "Assignment", "Lab Manual",
  "Lecture Notes", "Question Paper", "Research Paper", "Textbook"
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "likes", label: "Most liked" },
  { value: "views", label: "Most viewed" },
  { value: "downloads", label: "Most downloaded" },
];

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    subject: searchParams.get("subject") || "All",
    branch: "All",
    semester: "All",
    type: "All",
    sort: "newest",
    page: 1,
  });

  const [inputValue, setInputValue] = useState(filters.search);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.search && { search: filters.search }),
        ...(filters.subject !== "All" && { subject: filters.subject }),
        ...(filters.branch !== "All" && { branch: filters.branch }),
        ...(filters.semester !== "All" && { semester: filters.semester }),
        sort: filters.sort,
        page: filters.page,
        limit: 12,
      };
      const data = await getAllNotes(params);
      setNotes(data?.notes || []);
      setTotalPages(data?.totalPages || 1);
      setTotalNotes(data?.totalNotes || 0);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter("search", inputValue.trim());
  };

  const clearSearch = () => {
    setInputValue("");
    updateFilter("search", "");
  };

  const activeFiltersCount = [
    filters.subject !== "All",
    filters.branch !== "All",
    filters.semester !== "All",
    filters.type !== "All",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {previewNote && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewNote(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {previewNote.title}
                </h3>
                <p className="text-xs text-gray-400">
                  {previewNote.subject} · Sem {previewNote.semester}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewNote.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-full hover:bg-orange-600 transition-colors"
                >
                  Open in Drive
                </a>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe
              src={`https://drive.google.com/file/d/${previewNote.driveFileId}/preview`}
              className="flex-1 w-full"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Notes</h1>
          <p className="text-sm text-gray-400">
            {totalNotes} notes available · discover and download for free
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-orange-400 transition-all"
          >
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search notes, topics, subjects..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
            {inputValue && (
              <button type="button" onClick={clearSearch} className="text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </form>

          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="text-sm border border-gray-200 rounded-full px-3 py-2 bg-white text-gray-600 outline-none focus:border-orange-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border transition-all ${
                showFilters || activeFiltersCount > 0
                  ? "bg-orange-50 border-orange-300 text-orange-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject</p>
              <div className="flex gap-2 flex-wrap">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFilter("subject", s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      filters.subject === s
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-gray-200 text-gray-500 hover:border-orange-300 bg-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Branch</p>
              <div className="flex gap-2 flex-wrap">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    onClick={() => updateFilter("branch", b)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      filters.branch === b
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-gray-200 text-gray-500 hover:border-orange-300 bg-white"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Semester</p>
              <div className="flex gap-2 flex-wrap">
                {SEMESTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFilter("semester", s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      filters.semester === s
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-gray-200 text-gray-500 hover:border-orange-300 bg-white"
                    }`}
                  >
                    {s === "All" ? "All" : `Sem ${s}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note Type</p>
              <div className="flex gap-2 flex-wrap">
                {NOTE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => updateFilter("type", t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      filters.type === t
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-gray-200 text-gray-500 hover:border-orange-300 bg-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(filters.search || filters.subject !== "All" || filters.branch !== "All" || filters.semester !== "All" || filters.type !== "All") && (
          <div className="flex gap-2 flex-wrap mb-4">
            {filters.search && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full border border-orange-200">
                "{filters.search}"
                <button onClick={clearSearch}><X size={11} /></button>
              </span>
            )}
            {filters.subject !== "All" && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full border border-orange-200">
                {filters.subject}
                <button onClick={() => updateFilter("subject", "All")}><X size={11} /></button>
              </span>
            )}
            {filters.branch !== "All" && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full border border-orange-200">
                {filters.branch}
                <button onClick={() => updateFilter("branch", "All")}><X size={11} /></button>
              </span>
            )}
            {filters.semester !== "All" && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full border border-orange-200">
                Sem {filters.semester}
                <button onClick={() => updateFilter("semester", "All")}><X size={11} /></button>
              </span>
            )}
            {filters.type !== "All" && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs px-3 py-1.5 rounded-full border border-orange-200">
                {filters.type}
                <button onClick={() => updateFilter("type", "All")}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : notes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onPreview={(note) => setPreviewNote(note)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={filters.page === 1}
                  onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-orange-300 transition-all"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-500">
                  {filters.page} / {totalPages}
                </span>
                <button
                  disabled={filters.page === totalPages}
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-orange-300 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BookOpen size={44} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No notes found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}