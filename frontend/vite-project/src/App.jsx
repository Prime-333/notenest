import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";

import { syncUser } from "./services/notesService";
import { setAuthTokenGetter } from "./utils/api";

export default function App() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sync = async () => {
      try {
        console.log("🔄 Syncing user...");
        await syncUser();
        console.log("✅ User synced successfully");
      } catch (err) {
        console.error("❌ Sync failed:", err?.response?.data || err.message);
      }
    };

    sync();
  }, [isSignedIn, isLoaded]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#374151",
            border: "1px solid #f3f4f6",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadNotes />} />
        <Route path="/profile" element={<UserProfile />} />

        {/* Admin routes — standalone (no Clerk required) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminPanel />} />

        {/* Legacy /admin redirect */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
