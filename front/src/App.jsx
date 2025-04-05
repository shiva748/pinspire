import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
