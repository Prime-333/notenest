import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { Upload, FileText, X, CheckCircle, Loader2, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import { uploadNote } from "../services/notesService";
import toast from "react-hot-toast";

const BRANCHES = [
  "Civil Engineering",
  "Computer Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Other",
];

const SUBJECTS_BY_BRANCH = {
  "Civil Engineering": [
    "Concrete Technology", "Environmental Engineering", "Fluid Mechanics",
    "Geotechnical Engineering", "Mathematics", "Physics",
    "Structural Analysis", "Surveying", "Transportation Engineering", "Other"
  ],
  "Computer Engineering": [
    "Algorithms", "Artificial Intelligence", "Cloud Computing",
    "Computer Graphics", "Computer Networks", "Cryptography",
    "Data Structures", "Database Management", "Digital Electronics",
    "Java Programming", "Machine Learning", "Mathematics",
    "Microprocessors", "Mobile Computing", "Object Oriented Programming",
    "Operating Systems", "Physics", "Python Programming",
    "Software Engineering", "Web Technology", "Other"
  ],
  "Electrical Engineering": [
    "Circuit Theory", "Control Systems", "Electrical Machines",
    "Electrical Measurements", "Mathematics", "Physics",
    "Power Electronics", "Power Systems", "Signals and Systems", "Other"
  ],
  "Electronics Engineering": [
    "Analog Electronics", "Communication Systems", "Digital Electronics",
    "Embedded Systems", "Mathematics", "Microprocessors",
    "Physics", "Signal Processing", "VLSI Design", "Other"
  ],
  "Information Technology": [
    "Algorithms", "Artificial Intelligence", "Cloud Computing",
    "Computer Networks", "Cyber Security", "Data Science",
    "Data Structures", "Database Management", "Mathematics",
    "Mobile Application Development", "Operating Systems",
    "Physics", "Software Engineering", "Web Technology", "Other"
  ],
  "Mechanical Engineering": [
    "Fluid Mechanics", "Heat Transfer", "Machine Design",
    "Manufacturing Technology", "Mathematics", "Mechanics of Solids",
    "Physics", "Thermodynamics", "Theory of Machines", "Other"
  ],
  "Other": ["Other"],
};

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const NOTE_TYPES = [
  "Article", "Assignment", "Lab Manual", "Lecture Notes",
  "Question Paper", "Research Paper", "Textbook", "Other"
];

export default function UploadNotes() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    branch: "",
    semester: "",
    subject: "",
    noteType: "",
  });
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "branch" && { subject: "" }),
    }));
  };

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a PDF file"); return; }
    if (!form.title.trim()) { toast.error("Please enter a title"); return; }
    if (!form.branch) { toast.error("Please select a branch"); return; }
    if (!form.semester) { toast.error("Please select a semester"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(form).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      await uploadNote(formData);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-sm w-full">
            <BookOpen size={40} className="text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to upload</h2>
            <p className="text-sm text-gray-400 mb-6">
              You need to be signed in to share your notes with the community.
            </p>
            <SignInButton mode="modal">
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-full transition-colors">
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 p-12 max-w-sm w-full">
            <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Notes uploaded!</h2>
            <p className="text-sm text-gray-400">Your notes are now live on NoteNest. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  const availableSubjects = SUBJECTS_BY_BRANCH[form.branch] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload your notes</h1>
          <p className="text-sm text-gray-400">Share your handwritten notes with thousands of students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-orange-400 bg-orange-50"
                : file
                ? "border-orange-300 bg-orange-50"
                : "border-gray-200 bg-white hover:border-orange-300 hover:bg-gray-50"
            }`}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={28} className="text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">Drop your PDF here or click to browse</p>
                <p className="text-xs text-gray-400">PDF only · Max 20MB</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Data Structures Unit 3 — Trees"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-orange-400 transition-all placeholder-gray-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What topics are covered in these notes?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-orange-400 transition-all placeholder-gray-300 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Branch <span className="text-red-400">*</span>
              </label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white cursor-pointer"
              >
                <option value="">Select branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Semester <span className="text-red-400">*</span>
              </label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white cursor-pointer"
              >
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                disabled={!form.branch}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {form.branch ? "Select subject (optional)" : "Select branch first"}
                </option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note Type <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                name="noteType"
                value={form.noteType}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 bg-white cursor-pointer"
              >
                <option value="">Select type</option>
                {NOTE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading to Google Drive...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Notes
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            By uploading, you agree that these notes are your own work and are free to share.
          </p>
        </form>
      </div>
    </div>
  );
}