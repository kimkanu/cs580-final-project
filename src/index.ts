import { store } from "~/Store";
import { appActions } from "~/Store/Reducer/App";
import * as App from "~/App/Types";
import * as O from "fp-ts/Option";

// console.log(wasm.greet())
store.dispatch(appActions.change(App.Types.MAIN));
const { app } = store.getState().app;
if (O.isSome(app)) {
  app.value.run();
}
