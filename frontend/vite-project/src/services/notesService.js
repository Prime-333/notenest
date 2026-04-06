import API from "../utils/api";

export const getAllNotes = async (params = {}) => {
  const res = await API.get("/notes", { params });
  return res.data;
};

export const getTrendingNotes = async () => {
  const res = await API.get("/notes/trending");
  return res.data;
};

export const getMyNotes = async () => {
  const res = await API.get("/notes/my");
  return res.data;
};

export const getBookmarkedNotes = async () => {
  const res = await API.get("/notes/bookmarks");
  return res.data;
};

export const uploadNote = async (formData) => {
  const res = await API.post("/notes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const incrementView = async (noteId) => {
  const res = await API.post(`/notes/${noteId}/view`);
  return res.data;
};

export const incrementDownload = async (noteId) => {
  const res = await API.post(`/notes/${noteId}/download`);
  return res.data;
};

export const toggleLike = async (noteId) => {
  const res = await API.post(`/notes/${noteId}/toggle-like`);
  return res.data;
};

export const toggleBookmark = async (noteId) => {
  const res = await API.post(`/notes/${noteId}/bookmark`);
  return res.data;
};

export const reportNote = async (noteId, reason) => {
  const res = await API.post(`/notes/${noteId}/report`, { reason });
  return res.data;
};

export const syncUser = async () => {
  const res = await API.post("/auth/sync");
  return res.data;
};

export const deleteMyNote = async (noteId) => {
  const res = await API.delete(`/notes/${noteId}`);
  return res.data;
};