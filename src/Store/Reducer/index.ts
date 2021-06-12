import app, { appActions } from "./App";
import server, { serverActions } from "./Server";

export default { app, server };
export const actions = { app: appActions, server: serverActions };
