import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { setLogin } from "../redux/reducers/loginSlice";
import { setUser } from "../redux/reducers/userSlice";
import validator from "validator";

const AuthModal = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState({});
  const login = useSelector((state) => state.login);
  const { email, password, username, cPassword } = login;
  const dispatch = useDispatch();

  const update = (e) => {
    dispatch(setLogin({ ...login, [e.target.name]: e.target.value }));
    setError({ ...error, [e.target.name]: "" });
  };

  const validateForm = () => {
    let errors = {};
    if (isLogin) {
      if (!username.trim()) {
        errors.username = "Username or Email is required";
      }
    } else {
      if (!username.trim()) {
        errors.username = "Username is required";
      }
      if (!validator.isEmail(email)) {
        errors.email = "Please enter a valid email";
      }
      if (!password) {
        errors.password = "Password is required";
      } else if (!validator.isStrongPassword(password)) {
        errors.password = "Password is not strong enough";
      }
      if (password !== cPassword) {
        errors.cPassword = "Password must be the same";
      }
    }
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const register = async () => {
    if (validateForm()) {
      try {
        let res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username,
            email,
            password,
            cPassword,
          }),
        });

        let data = await res.json();
        if (res.ok) {
          console.log("Registration successful:", data);
          document.getElementById("auth_modal").close();
        } else {
          console.error("Registration failed:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const loginUser = async () => {
    if (validateForm()) {
      try {
        // Check if the input is an email or username
        const isEmail = validator.isEmail(username);
        
        let res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            // Set the appropriate field based on input validation
            ...(isEmail ? { email: username } : { username }),
            password,
          }),
        });

        let data = await res.json();
        if (res.ok) {
          console.log("Login successful:", data);
          document.getElementById("auth_modal").close();
          dispatch(setUser({ logged: true, data: res.data }));
        } else {
          console.error("Login failed:", data.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <dialog id="auth_modal" className="modal">
      <div className="modal-box max-w-md bg-base-100 rounded-2xl shadow-2xl p-0 overflow-hidden" style={{ overflowX: "hidden" }}>
        <form method="dialog">
          <button className="btn btn-sm btn-circle absolute right-4 top-4 bg-base-200 hover:bg-base-300 border-none text-base-content z-10">
            ✕
          </button>
        </form>
        
        <div className="flex justify-center p-6 bg-primary/5">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0a12 12 0 0 0-4.373 23.178c-.035-.947-.003-2.086.236-3.113.263-1.023 1.696-6.455 1.696-6.455s-.426-.867-.426-2.115c0-1.984 1.15-3.463 2.583-3.463 1.22 0 1.81.915 1.81 2.013 0 1.223-.777 3.055-1.182 4.751-.337 1.42.714 2.584 2.121 2.584 2.541 0 4.25-3.264 4.25-7.127 0-2.938-1.979-5.136-5.582-5.136-4.07 0-6.604 3.036-6.604 6.426 0 1.17.345 1.993.897 2.63.252.299.29.417.197.76-.066.252-.217.86-.279 1.102-.09.346-.366.47-.673.342-1.878-.766-2.756-2.831-2.756-5.15 0-3.827 3.228-8.416 9.627-8.416 5.145 0 8.527 3.724 8.527 7.72 0 5.283-2.937 9.232-7.268 9.232-1.455 0-2.823-.788-3.29-1.682l-.895 3.55c-.323 1.172-.957 2.346-1.536 3.27.866.257 1.776.395 2.717.395a12 12 0 0 0 12-12A12 12 0 0 0 12 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-primary">Pinspire</h3>
          </div>
        </div>

        <div className="px-8 pt-6 pb-8">
          <div className="flex mb-8">
            <button 
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${isLogin ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'}`}
              onClick={() => setIsLogin(true)}
            >
              Log in
            </button>
            <button 
              className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${!isLogin ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'}`}
              onClick={() => setIsLogin(false)}
            >
              Sign up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h3 className="text-xl font-bold text-center mb-6">
                  Welcome to Pinspire
                </h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Email or username"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={username}
                      name="username"
                      onChange={update}
                    />
                    {error.username && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.username}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      name="password"
                      onChange={update}
                    />
                    {error.password && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.password}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <a href="#" className="text-sm text-primary hover:underline">Forgot your password?</a>
                  </div>
                  <button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-content py-3 rounded-full font-semibold transition-colors"
                    onClick={loginUser}
                  >
                    Log in
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-base-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-base-100 px-4 text-sm text-base-content/70">OR</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-base-200 hover:bg-base-300 text-base-content py-3 rounded-full font-semibold flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h3 className="text-xl font-bold text-center mb-6">
                  Find new ideas to try
                </h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      name="username"
                      value={username}
                      onChange={update}
                    />
                    {error.username && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.username}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      name="email"
                      onChange={update}
                      value={email}
                    />
                    {error.email && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.email}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Create a password"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      name="password"
                      onChange={update}
                      value={password}
                    />
                    {error.password && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.password}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      className="w-full px-4 py-3 rounded-full bg-base-200 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      name="cPassword"
                      onChange={update}
                      value={cPassword}
                    />
                    {error.cPassword && (
                      <p className="text-red-500 text-sm mt-1 ml-4">{error.cPassword}</p>
                    )}
                  </div>
                  <p className="text-xs text-base-content/70">
                    By continuing, you agree to Pinspire's Terms of Service and acknowledge you've read our Privacy Policy
                  </p>
                  <button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-content py-3 rounded-full font-semibold transition-colors"
                    onClick={register}
                  >
                    Continue
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-base-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-base-100 px-4 text-sm text-base-content/70">OR</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-base-200 hover:bg-base-300 text-base-content py-3 rounded-full font-semibold flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-xs text-center text-base-content/60 mt-6">
            {isLogin ? "Need an account? " : "Already a member? "}
            <button 
              className="text-primary hover:underline font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </dialog>
  );
};

export default AuthModal;
