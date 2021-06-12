import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ServerState {
  isAlive: boolean;
}

const initialState: ServerState = {
  isAlive: false,
};

export const serverSlice = createSlice({
  name: "server",
  initialState,
  reducers: {
    setAlive: (state, action: PayloadAction<boolean>) => {
      state.isAlive = action.payload;
    },
  },
});

export const serverActions = serverSlice.actions;

export default serverSlice.reducer;
