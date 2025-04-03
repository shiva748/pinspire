import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  email: "",
  username: "",
  password: "",
  cPassword: "",
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { setLogin } = loginSlice.actions;
export default loginSlice.reducer;
