import { store } from "~/Store";
import { actions } from "~/Store/Reducer";
import * as A from "~/App/Types";
import * as O from "fp-ts/Option";

store.dispatch(actions.app.change(A.Types.MAIN));

const { app } = store.getState().app;
if (O.isSome(app)) {
  app.value.run();
}

setTimeout(() => {
  updateServerIsAlive();
}, 100);
setInterval(() => {
  updateServerIsAlive();
}, 10000);

function updateServerIsAlive() {
  fetch(process.env.SERVER!)
    .then((r) => {
      store.dispatch(actions.server.setAlive(r.status === 200));
    })
    .catch(() => {
      store.dispatch(actions.server.setAlive(false));
    });
}
