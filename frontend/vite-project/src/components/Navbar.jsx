import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";
import { Search, Upload, Menu, X, BookOpen, Shield, LogOut } from "lucide-react";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setMenuOpen(false);
    }
  };

  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    user?.unsafeMetadata?.role === "admin";

  const handleSignOut = async () => {
    try {
      await signOut();
      setDropdownOpen(false);
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <BookOpen size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Note<span className="text-orange-500">Nest</span>
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-orange-400 focus-within:bg-white transition-all"
          >
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, subjects, topics..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
          </form>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
            >
              Browse
            </Link>

            {isSignedIn ? (
              <>
                <Link
                  to="/upload"
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <Upload size={14} />
                  Upload Notes
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold text-sm border-2 border-transparent hover:border-orange-300 transition-all overflow-hidden"
                  >
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.firstName?.[0]?.toUpperCase() || "U"
                    )}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Profile
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <Shield size={13} />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-300 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <Link
                  to="/upload"
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <Upload size={14} />
                  Upload Notes
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2"
            >
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </form>

            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1"
            >
              Browse Notes
            </Link>

            <Link
              to="/upload"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-orange-500 py-1"
            >
              Upload Notes
            </Link>

            {isSignedIn && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 py-1"
              >
                My Profile
              </Link>
            )}

            {isSignedIn && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-orange-600 py-1"
              >
                Admin Panel
              </Link>
            )}

            {isSignedIn ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-red-500 py-1"
              >
                <LogOut size={15} />
                Sign out
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="block text-sm font-medium text-gray-700 py-1">
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}