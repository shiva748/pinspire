import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../redux/reducers/userSlice";
import AuthModal from "./Auth";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread message count
  useEffect(() => {
    if (user.logged) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/chat/unread', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              setUnreadCount(data.unreadCount);
            }
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      };
      
      // Fetch immediately
      fetchUnreadCount();
      
      // And then every 30 seconds
      const intervalId = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user.logged]);

  const logout = async () => {
    try {
      let res = await fetch("/api/auth/logout", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      let data = await res.json();
      if (res.ok) {
        console.log("Logout was successfull:", data);
        dispatch(setUser({ logged: false, data: {} }));
      } else {
        console.error("Logout failed:", data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-base-100 border-b border-base-200">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0a12 12 0 0 0-4.373 23.178c-.035-.947-.003-2.086.236-3.113.263-1.023 1.696-6.455 1.696-6.455s-.426-.867-.426-2.115c0-1.984 1.15-3.463 2.583-3.463 1.22 0 1.81.915 1.81 2.013 0 1.223-.777 3.055-1.182 4.751-.337 1.42.714 2.584 2.121 2.584 2.541 0 4.25-3.264 4.25-7.127 0-2.938-1.979-5.136-5.582-5.136-4.07 0-6.604 3.036-6.604 6.426 0 1.17.345 1.993.897 2.63.252.299.29.417.197.76-.066.252-.217.86-.279 1.102-.09.346-.366.47-.673.342-1.878-.766-2.756-2.831-2.831-5.15 0-3.827 3.228-8.416 9.627-8.416 5.145 0 8.527 3.724 8.527 7.72 0 5.283-2.937 9.232-7.268 9.232-1.455 0-2.823-.788-3.29-1.682l-.895 3.55c-.323 1.172-.957 2.346-1.536 3.27.866.257 1.776.395 2.717.395a12 12 0 0 0 12-12A12 12 0 0 0 12 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold hidden md:block text-base-content">Pinspire</span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" active={isActive("/")}>
                Home
              </NavLink>
              <NavLink to="/explore" active={isActive("/explore")}>
                Explore
              </NavLink>
              <NavLink to="/create" active={isActive("/create")}>
                Create
              </NavLink>
            </nav>

            {/* User section */}
            <div className="flex items-center">
              {user.logged ? (
                <div className="flex items-center gap-3">
                  {/* Messages Icon with Badge */}
                  <Link to="/messages" className="relative p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-content text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-base-200">
                        {user.data.profilePicture ? (
                          <img
                            alt="User profile"
                            src={`/api/images/${user.data.profilePicture}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-sm font-bold">
                            {user.data.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <span className="hidden md:flex items-center text-base-content font-medium">
                        {user.data.username || "Account"}
                        <svg className="w-4 h-4 ml-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-xl shadow-xl w-56 p-2 mt-2 border border-base-200 z-[1]"
                    >
                      <li>
                        <Link to="/profile" className="menu-item">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                      </li>
                      
                      {/* Admin Dashboard Link - only for admin users */}
                      {user.data.isAdmin && (
                        <li>
                          <Link to="/admin" className="menu-item text-primary">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Admin Dashboard
                          </Link>
                        </li>
                      )}
                      <li>
                        <Link to="/upload/image" className="menu-item">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          Create Pin
                        </Link>
                      </li>
                      <li>
                        <Link to="/settings" className="menu-item">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                      </li>
                      <li>
                        <Link to="/messages" className="menu-item">
                          <div className="flex items-center w-full">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Messages
                            {unreadCount > 0 && (
                              <span className="ml-auto bg-primary text-primary-content text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                      <div className="border-t border-base-200 mt-1 pt-1">
                        <li>
                          <button onClick={logout} className="menu-item text-error hover:bg-error/10">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log out
                          </button>
                        </li>
                      </div>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-lg font-medium transition-colors"
                    onClick={() => document.getElementById("auth_modal").showModal()}
                  >
                    Log in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-base-100 border-t border-base-200 z-40">
        <div className="flex justify-around h-16">
          <NavLink to="/" active={isActive("/")} isMobile>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </NavLink>
          <NavLink to="/explore" active={isActive("/explore")} isMobile>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-1">Explore</span>
          </NavLink>
          <NavLink to="/create" active={isActive("/create")} isMobile>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Create</span>
          </NavLink>
          <NavLink to="/messages" active={isActive("/messages")} isMobile>
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Messages</span>
          </NavLink>
          <NavLink to="/profile" active={isActive("/profile")} isMobile>
            <div className="w-6 h-6 rounded-full overflow-hidden">
              {user.logged && user.data?.profilePicture ? (
                <img
                  alt="User profile"
                  src={`/api/images/${user.data.profilePicture}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-xs font-bold">
                  {user.logged ? (user.data?.username?.charAt(0).toUpperCase() || "?") : "?"}
                </div>
              )}
            </div>
            <span className="text-xs mt-1">Profile</span>
          </NavLink>
        </div>
      </div>
      
      <AuthModal />
    </>
  );
};

// Custom NavLink component with active state
const NavLink = ({ children, to, active, isMobile = false }) => {
  if (isMobile) {
    return (
      <Link to={to} className={`flex flex-col items-center justify-center w-full transition-all duration-200 ${
        active 
          ? 'text-primary font-medium scale-110' 
          : 'text-base-content/70 hover:text-base-content'
      }`}>
        {children}
      </Link>
    );
  }
  
  return (
    <Link
      to={to}
      className={`
        px-4 py-2 rounded-full font-medium transition-all duration-200
        ${active
          ? 'bg-primary/15 text-primary shadow-sm'
          : 'text-base-content/70 hover:text-base-content hover:bg-base-200/80 hover:rounded-full'
        }
      `}
    >
      {children}
    </Link>
  );
};

export default Navbar;
