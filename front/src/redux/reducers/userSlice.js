import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { logged: false, data: {} },
  reducers: {
    setUser: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
