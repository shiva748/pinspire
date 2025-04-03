import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { logged: false, data: {} },
  reducers: {
    setUser: (state, action) => {
      Object.assign(state, action.payload);
    },
    updateProfile: (state, action) => {
      if (state.logged && state.data) {
        state.data = {
          ...state.data,
          ...action.payload
        };
      }
    },
    logoutUser: (state) => {
      state.logged = false;
      state.data = {};
    }
  },
});

export const { setUser, updateProfile, logoutUser } = userSlice.actions;
export default userSlice.reducer;
