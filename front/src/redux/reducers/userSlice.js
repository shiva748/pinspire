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
    followUser: (state, action) => {
      if (state.logged && state.data) {
        const userId = action.payload;
        if (!state.data.following) {
          state.data.following = [];
        }
        if (!state.data.following.includes(userId)) {
          state.data.following.push(userId);
        }
      }
    },
    unfollowUser: (state, action) => {
      if (state.logged && state.data && state.data.following) {
        const userId = action.payload;
        state.data.following = state.data.following.filter(id => 
          id !== userId && id.toString() !== userId.toString()
        );
      }
    },
    logoutUser: (state) => {
      state.logged = false;
      state.data = {};
    }
  },
});

export const { setUser, updateProfile, followUser, unfollowUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;
