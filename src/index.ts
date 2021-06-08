import { store } from "~/src/Store";
import { appActions } from "~/src/Store/Reducer/App";
import * as App from "~/src/App/Types";
import * as O from "fp-ts/Option";

import * as wasm from "wasm-blend";

// console.log(wasm.greet())
store.dispatch(appActions.change(App.Types.MAIN));
const { app } = store.getState().app;
if (O.isSome(app)) {
  app.value.run();
}
