import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./reducers/userSlice";
import loginReducer from "./reducers/loginSlice";
const store = configureStore({
  reducer: {
    user: userReducer,
    login: loginReducer,
  },
});

export default store;
