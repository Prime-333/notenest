import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import LandingPage  from "./pages/LandingPage";
import Dashboard    from "./pages/Dashboard";
import UploadNotes  from "./pages/UploadNotes";
import UserProfile  from "./pages/UserProfile";
import AdminPanel   from "./pages/AdminPanel";

import { syncUser } from "./services/notesService";

export default function App() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;

    const sync = async () => {
      try {
        await getToken();
        await syncUser();
      } catch (err) {
        console.error("Sync failed:", err);
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
        <Route path="/"        element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload"  element={<UploadNotes />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin"   element={<AdminPanel />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}