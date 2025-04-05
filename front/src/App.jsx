import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./templates/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "./redux/reducers/userSlice";
import Footer from "./templates/footer";
import Profile from "./pages/Profile";
import PinspireGallery from "./pages/PinspireGallery";
import NotFoundPage from "./pages/NotFoundPage";
import UploadImage from "./pages/UploadImage";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingApprovals from "./pages/admin/PendingApprovals";
import UserManagement from "./pages/admin/UserManagement";

// Admin route guard component
const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.user);
  
  if (!user.logged || !user.data.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const User = useSelector((state) => state.user);
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        let res = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        let data = await res.json();
        if (res.ok) {
          dispatch(setUser({ logged: true, data: data.data }));
        } else {
          console.error("No active session found", data.message);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-lg font-semibold">
          Loading<span className="loading loading-ring loading-xl"></span>
        </h2>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {User.logged ? (
          <>
            <Route path="/profile" element={<Profile />} />
            <Route path="/create" element={<UploadImage />} />
            
            {/* Admin Routes */}
            {User.data.isAdmin && (
              <>
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/approvals" 
                  element={
                    <AdminRoute>
                      <PendingApprovals />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  } 
                />
              </>
            )}
          </>
        ) : (
          ""
        )}
        <Route path="/explore" element={<PinspireGallery />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
