import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as O from "fp-ts/Option";

import { State } from "~/Store";
import * as A from "~/App/Types";
import { MainApp } from "~/App/MainVRM";

interface AppState {
  app: O.Option<A.App>;
}

const initialState: AppState = {
  app: O.none,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    change: (state, action: PayloadAction<A.Types>) => {
      switch (action.payload) {
        case A.Types.NONE: {
          state.app = O.none;
          break;
        }
        case A.Types.MAIN: {
          state.app = O.some(new MainApp());
          break;
        }
      }
    },
  },
});

export const appActions = appSlice.actions;

export const selectApp = (state: State) => state.app.app;

export default appSlice.reducer;
