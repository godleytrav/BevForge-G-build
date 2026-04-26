import { loadEnv } from 'dotenv-local';
import express from 'express';
import { l as serverBefore, m as handler, n as serverAfter } from './bin/index-BiQ9ukMS.js';
import 'node:path';
import 'node:fs';
import 'node:fs/promises';
import './bin/api/os/recipes/import/POST-B16W0CFH.js';
import 'fast-xml-parser';
import 'node:crypto';
import 'drizzle-orm/mysql2';
import 'mysql2/promise';
import 'drizzle-orm/mysql-core';
import './bin/api/calendar/events/GET-DNBekL63.js';
import './bin/api/calendar/events/POST-1Wn8nY2A.js';
import './bin/api/commerce/create-checkout-session/POST-vy5ncz3K.js';
import './bin/api/health/GET-CzFTnlth.js';
import './bin/api/os/alarms/GET-CrZbhsBT.js';
import 'drizzle-orm';
import './bin/api/os/automation/preview/POST-9t5IqZ5t.js';
import './bin/api/os/automation/run/POST-C5jdG3c5.js';
import './bin/api/os/automation/run/_runId_/stop/POST-BXDX6foY.js';
import './bin/api/os/automation/runs/GET-Db56UGmy.js';
import './bin/api/os/availability/GET-CCSKE-e3.js';
import './bin/api/os/batches/GET-BqayXPZJ.js';
import './bin/api/os/batches/POST-DA9qVwiY.js';
import './bin/api/os/batches/_batchId_/PUT-BqUhJLoz.js';
import './bin/api/os/bindings/GET-CBlLeGPj.js';
import './bin/api/os/canvas/project/GET-CnmRXS_Q.js';
import './bin/api/os/canvas/project/PUT-Cdap9Aq4.js';
import './bin/api/os/command/POST-B6XVB7C8.js';
import 'crypto';
import './bin/api/os/command/_commandId_/GET-MWQ0qNtW.js';
import './bin/api/os/endpoints/GET--VFXnif2.js';
import './bin/api/os/flow/pour-events/GET-LI4duKA3.js';
import './bin/api/os/flow/pour-events/POST-BiAC8STh.js';
import './bin/api/os/flow/profile/GET-BMXGnYPo.js';
import './bin/api/os/flow/profiles/GET-DkjfeaiI.js';
import './bin/api/os/flow/publish/POST-BmQ5MolT.js';
import './bin/api/os/flow/runtime-state/GET-C_mAHd3N.js';
import './bin/api/os/flow/runtime-state/POST-EN2fjUX3.js';
import './bin/api/os/groups/GET-AIkilshN.js';
import './bin/api/os/inventory/GET-CrrFrEI-.js';
import './bin/api/os/inventory/POST-63DoxhBH.js';
import './bin/api/os/inventory/movements/GET-nEKUmT4-.js';
import './bin/api/os/lab/drafts/GET-DQPGGql2.js';
import './bin/api/os/lab/drafts/POST-BWiZOCSv.js';
import './bin/api/os/lab/handoff-audit/GET-D2tje6Er.js';
import './bin/api/os/lab/handoff-audit/POST-rTRQjd0z.js';
import './bin/api/os/nodes/GET-DNrAg92b.js';
import './bin/api/os/recipes/GET-BkbgHPUS.js';
import './bin/api/os/recipes/equipment-map/GET-B3amRtsA.js';
import './bin/api/os/recipes/equipment-map/PUT-BOx4CE2l.js';
import './bin/api/os/recipes/inbox/scan/POST-GdIMZvhK.js';
import './bin/api/os/recipes/inbox/status/GET-nW5ddx7w.js';
import './bin/api/os/recipes/preflight/POST-CjPXUHbZ.js';
import './bin/api/os/recipes/run/start/POST-D6Buh6_-.js';
import './bin/api/os/recipes/run/_runId_/action/POST-KeDHAeBT.js';
import './bin/api/os/recipes/run/_runId_/readings/GET-DTywQnbH.js';
import './bin/api/os/recipes/run/_runId_/readings/POST-B03OoVgz.js';
import './bin/api/os/recipes/run/_runId_/readings/snapshot/POST-BtKu5lO2.js';
import './bin/api/os/recipes/run/_runId_/runboard/GET-9w4Y4NW_.js';
import './bin/api/os/recipes/run/_runId_/runboard/PUT-BARVGufU.js';
import './bin/api/os/recipes/run/_runId_/steps/_stepId_/PUT-CyklW7nd.js';
import './bin/api/os/recipes/run/_runId_/transfer/POST-D07T26AX.js';
import './bin/api/os/recipes/runs/GET-BTXE7ND6.js';
import './bin/api/os/recipes/runs/reset/POST-DRzOisgq.js';
import './bin/api/os/recipes/transfer-map/GET-Bp9Lgxsk.js';
import './bin/api/os/recipes/transfer-map/PUT-8gcu6bK4.js';
import './bin/api/os/recipes/transfer-map/autofill/POST-DwOgle3C.js';
import './bin/api/os/registry/devices/GET-BTjrmZ2S.js';
import './bin/api/os/registry/devices/PUT-21RfBEzI.js';
import './bin/api/os/reservations/POST-CY1ug9iS.js';
import './bin/api/os/reservations/_reservationId_/action/POST-DeWkyaX7.js';
import './bin/api/os/telemetry/latest/GET-3oiY6Phk.js';
import './bin/api/os/tiles/GET-BX2eJd-q.js';
import './bin/api/os/tiles/_tileId_/GET-DX-KSLe9.js';

var server = express();
serverBefore?.(server);
var { HOST, PORT } = loadEnv({
  envPrefix: "SERVER_",
  removeEnvPrefix: true,
  envInitial: {
    SERVER_HOST: "127.0.0.1",
    SERVER_PORT: "3000"
  }
});
var SERVER_URL = `http://${HOST}:${PORT}${"/"}`;
server.use("/api", handler);
server.use("/", express.static("client"));
serverAfter?.(server);
var PORT_NRO = parseInt(PORT);
server.listen(PORT_NRO, HOST, () => {
  console.log(`Ready at ${SERVER_URL}`);
}).on("error", (error) => {
  console.error(`Error at ${SERVER_URL}`, error);
});
