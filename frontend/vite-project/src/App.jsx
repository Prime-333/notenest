import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";

import { syncUser } from "./services/notesService";

export default function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasSyncedRef.current) return;

    const syncCurrentUser = async () => {
      try {
        const token = await getToken();

        if (!token) {
          console.warn("⚠️ No Clerk token available for sync");
          return;
        }

        await syncUser();
        hasSyncedRef.current = true;
        console.log("✅ User synced successfully");
      } catch (err) {
        console.error("❌ Sync failed:", err?.response?.data || err.message);

        // Retry once after short delay (helps mobile / slow session init)
        setTimeout(async () => {
          try {
            await syncUser();
            hasSyncedRef.current = true;
            console.log("✅ User synced successfully on retry");
          } catch (retryErr) {
            console.error(
              "❌ Retry sync failed:",
              retryErr?.response?.data || retryErr.message
            );
          }
        }, 1500);
      }
    };

    syncCurrentUser();
  }, [isSignedIn, isLoaded, user, getToken]);

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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}