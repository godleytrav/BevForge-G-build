
// Files Imports
import * as configure from "@api/configure";
import * as API_000 from "@api/root/src/server/api/calendar/events/GET.ts";
import * as API_001 from "@api/root/src/server/api/calendar/events/POST.ts";
import * as API_002 from "@api/root/src/server/api/commerce/create-checkout-session/POST.ts";
import * as API_003 from "@api/root/src/server/api/health/GET.ts";
import * as API_004 from "@api/root/src/server/api/os/alarms/GET.ts";
import * as API_005 from "@api/root/src/server/api/os/automation/preview/POST.ts";
import * as API_006 from "@api/root/src/server/api/os/automation/run/POST.ts";
import * as API_007 from "@api/root/src/server/api/os/automation/run/[runId]/stop/POST.ts";
import * as API_008 from "@api/root/src/server/api/os/automation/runs/GET.ts";
import * as API_009 from "@api/root/src/server/api/os/availability/GET.ts";
import * as API_010 from "@api/root/src/server/api/os/batches/GET.ts";
import * as API_011 from "@api/root/src/server/api/os/batches/POST.ts";
import * as API_012 from "@api/root/src/server/api/os/batches/[batchId]/PUT.ts";
import * as API_013 from "@api/root/src/server/api/os/batches/[batchId]/lineage/GET.ts";
import * as API_014 from "@api/root/src/server/api/os/bindings/GET.ts";
import * as API_015 from "@api/root/src/server/api/os/canvas/project/GET.ts";
import * as API_016 from "@api/root/src/server/api/os/canvas/project/PUT.ts";
import * as API_017 from "@api/root/src/server/api/os/command/POST.ts";
import * as API_018 from "@api/root/src/server/api/os/command/[commandId]/GET.ts";
import * as API_019 from "@api/root/src/server/api/os/compliance/feed/GET.ts";
import * as API_020 from "@api/root/src/server/api/os/endpoints/GET.ts";
import * as API_021 from "@api/root/src/server/api/os/flow/pour-events/GET.ts";
import * as API_022 from "@api/root/src/server/api/os/flow/pour-events/POST.ts";
import * as API_023 from "@api/root/src/server/api/os/flow/profile/GET.ts";
import * as API_024 from "@api/root/src/server/api/os/flow/profiles/GET.ts";
import * as API_025 from "@api/root/src/server/api/os/flow/publish/POST.ts";
import * as API_026 from "@api/root/src/server/api/os/flow/runtime-state/GET.ts";
import * as API_027 from "@api/root/src/server/api/os/flow/runtime-state/POST.ts";
import * as API_028 from "@api/root/src/server/api/os/fulfillment/outbox/GET.ts";
import * as API_029 from "@api/root/src/server/api/os/fulfillment/requests/GET.ts";
import * as API_030 from "@api/root/src/server/api/os/fulfillment/requests/POST.ts";
import * as API_031 from "@api/root/src/server/api/os/fulfillment/requests/[requestId]/action/POST.ts";
import * as API_032 from "@api/root/src/server/api/os/groups/GET.ts";
import * as API_033 from "@api/root/src/server/api/os/inventory/GET.ts";
import * as API_034 from "@api/root/src/server/api/os/inventory/POST.ts";
import * as API_035 from "@api/root/src/server/api/os/inventory/movements/GET.ts";
import * as API_036 from "@api/root/src/server/api/os/inventory/procurement/orders/GET.ts";
import * as API_037 from "@api/root/src/server/api/os/inventory/procurement/orders/POST.ts";
import * as API_038 from "@api/root/src/server/api/os/inventory/procurement/orders/[orderId]/receive/POST.ts";
import * as API_039 from "@api/root/src/server/api/os/inventory/[itemId]/PUT.ts";
import * as API_040 from "@api/root/src/server/api/os/lab/drafts/GET.ts";
import * as API_041 from "@api/root/src/server/api/os/lab/drafts/POST.ts";
import * as API_042 from "@api/root/src/server/api/os/lab/handoff-audit/GET.ts";
import * as API_043 from "@api/root/src/server/api/os/lab/handoff-audit/POST.ts";
import * as API_044 from "@api/root/src/server/api/os/library/hardware/GET.ts";
import * as API_045 from "@api/root/src/server/api/os/locations/GET.ts";
import * as API_046 from "@api/root/src/server/api/os/locations/PUT.ts";
import * as API_047 from "@api/root/src/server/api/os/nodes/GET.ts";
import * as API_048 from "@api/root/src/server/api/os/notifications/GET.ts";
import * as API_049 from "@api/root/src/server/api/os/notifications/POST.ts";
import * as API_050 from "@api/root/src/server/api/os/package-lots/GET.ts";
import * as API_051 from "@api/root/src/server/api/os/package-lots/POST.ts";
import * as API_052 from "@api/root/src/server/api/os/package-lots/[lotId]/action/POST.ts";
import * as API_053 from "@api/root/src/server/api/os/packaging/reconcile/POST.ts";
import * as API_054 from "@api/root/src/server/api/os/packaging/runs/GET.ts";
import * as API_055 from "@api/root/src/server/api/os/packaging/runs/POST.ts";
import * as API_056 from "@api/root/src/server/api/os/packaging/runs/[runId]/action/POST.ts";
import * as API_057 from "@api/root/src/server/api/os/products/GET.ts";
import * as API_058 from "@api/root/src/server/api/os/products/POST.ts";
import * as API_059 from "@api/root/src/server/api/os/products/media/[assetId]/[variant]/GET.ts";
import * as API_060 from "@api/root/src/server/api/os/products/[productId]/PUT.ts";
import * as API_061 from "@api/root/src/server/api/os/recipes/GET.ts";
import * as API_062 from "@api/root/src/server/api/os/recipes/POST.ts";
import * as API_063 from "@api/root/src/server/api/os/recipes/equipment-map/GET.ts";
import * as API_064 from "@api/root/src/server/api/os/recipes/equipment-map/PUT.ts";
import * as API_065 from "@api/root/src/server/api/os/recipes/import/POST.ts";
import * as API_066 from "@api/root/src/server/api/os/recipes/inbox/scan/POST.ts";
import * as API_067 from "@api/root/src/server/api/os/recipes/inbox/status/GET.ts";
import * as API_068 from "@api/root/src/server/api/os/recipes/preflight/POST.ts";
import * as API_069 from "@api/root/src/server/api/os/recipes/run/start/POST.ts";
import * as API_070 from "@api/root/src/server/api/os/recipes/run/[runId]/action/POST.ts";
import * as API_071 from "@api/root/src/server/api/os/recipes/run/[runId]/readings/GET.ts";
import * as API_072 from "@api/root/src/server/api/os/recipes/run/[runId]/readings/POST.ts";
import * as API_073 from "@api/root/src/server/api/os/recipes/run/[runId]/readings/snapshot/POST.ts";
import * as API_074 from "@api/root/src/server/api/os/recipes/run/[runId]/runboard/GET.ts";
import * as API_075 from "@api/root/src/server/api/os/recipes/run/[runId]/runboard/PUT.ts";
import * as API_076 from "@api/root/src/server/api/os/recipes/run/[runId]/steps/[stepId]/PUT.ts";
import * as API_077 from "@api/root/src/server/api/os/recipes/run/[runId]/transfer/POST.ts";
import * as API_078 from "@api/root/src/server/api/os/recipes/runs/GET.ts";
import * as API_079 from "@api/root/src/server/api/os/recipes/runs/reset/POST.ts";
import * as API_080 from "@api/root/src/server/api/os/recipes/transfer-map/GET.ts";
import * as API_081 from "@api/root/src/server/api/os/recipes/transfer-map/PUT.ts";
import * as API_082 from "@api/root/src/server/api/os/recipes/transfer-map/autofill/POST.ts";
import * as API_083 from "@api/root/src/server/api/os/registry/devices/GET.ts";
import * as API_084 from "@api/root/src/server/api/os/registry/devices/PUT.ts";
import * as API_085 from "@api/root/src/server/api/os/reports/artifacts/GET.ts";
import * as API_086 from "@api/root/src/server/api/os/reports/artifacts/[artifactId]/GET.ts";
import * as API_087 from "@api/root/src/server/api/os/reports/export/POST.ts";
import * as API_088 from "@api/root/src/server/api/os/reservations/POST.ts";
import * as API_089 from "@api/root/src/server/api/os/reservations/[reservationId]/action/POST.ts";
import * as API_090 from "@api/root/src/server/api/os/settings/GET.ts";
import * as API_091 from "@api/root/src/server/api/os/settings/PUT.ts";
import * as API_092 from "@api/root/src/server/api/os/telemetry/latest/GET.ts";
import * as API_093 from "@api/root/src/server/api/os/tiles/GET.ts";
import * as API_094 from "@api/root/src/server/api/os/tiles/[tileId]/GET.ts";
import * as API_095 from "@api/root/src/server/api/os/transfers/GET.ts";
import * as API_096 from "@api/root/src/server/api/os/transfers/POST.ts";
import * as API_097 from "@api/root/src/server/api/os/transfers/[runId]/action/POST.ts";

// Public RESTful API Methods and Paths
// This section describes the available HTTP methods and their corresponding endpoints (paths).
// GET  /api/calendar/events/                                     src/server/api/calendar/events/GET.ts
// POST /api/calendar/events/                                     src/server/api/calendar/events/POST.ts
// POST /api/commerce/create-checkout-session/                    src/server/api/commerce/create-checkout-session/POST.ts
// GET  /api/health/                                              src/server/api/health/GET.ts
// GET  /api/os/alarms/                                           src/server/api/os/alarms/GET.ts
// POST /api/os/automation/preview/                               src/server/api/os/automation/preview/POST.ts
// POST /api/os/automation/run/                                   src/server/api/os/automation/run/POST.ts
// POST /api/os/automation/run/:runId/stop/                       src/server/api/os/automation/run/[runId]/stop/POST.ts
// GET  /api/os/automation/runs/                                  src/server/api/os/automation/runs/GET.ts
// GET  /api/os/availability/                                     src/server/api/os/availability/GET.ts
// GET  /api/os/batches/                                          src/server/api/os/batches/GET.ts
// POST /api/os/batches/                                          src/server/api/os/batches/POST.ts
// PUT  /api/os/batches/:batchId/                                 src/server/api/os/batches/[batchId]/PUT.ts
// GET  /api/os/batches/:batchId/lineage/                         src/server/api/os/batches/[batchId]/lineage/GET.ts
// GET  /api/os/bindings/                                         src/server/api/os/bindings/GET.ts
// GET  /api/os/canvas/project/                                   src/server/api/os/canvas/project/GET.ts
// PUT  /api/os/canvas/project/                                   src/server/api/os/canvas/project/PUT.ts
// POST /api/os/command/                                          src/server/api/os/command/POST.ts
// GET  /api/os/command/:commandId/                               src/server/api/os/command/[commandId]/GET.ts
// GET  /api/os/compliance/feed/                                  src/server/api/os/compliance/feed/GET.ts
// GET  /api/os/endpoints/                                        src/server/api/os/endpoints/GET.ts
// GET  /api/os/flow/pour-events/                                 src/server/api/os/flow/pour-events/GET.ts
// POST /api/os/flow/pour-events/                                 src/server/api/os/flow/pour-events/POST.ts
// GET  /api/os/flow/profile/                                     src/server/api/os/flow/profile/GET.ts
// GET  /api/os/flow/profiles/                                    src/server/api/os/flow/profiles/GET.ts
// POST /api/os/flow/publish/                                     src/server/api/os/flow/publish/POST.ts
// GET  /api/os/flow/runtime-state/                               src/server/api/os/flow/runtime-state/GET.ts
// POST /api/os/flow/runtime-state/                               src/server/api/os/flow/runtime-state/POST.ts
// GET  /api/os/fulfillment/outbox/                               src/server/api/os/fulfillment/outbox/GET.ts
// GET  /api/os/fulfillment/requests/                             src/server/api/os/fulfillment/requests/GET.ts
// POST /api/os/fulfillment/requests/                             src/server/api/os/fulfillment/requests/POST.ts
// POST /api/os/fulfillment/requests/:requestId/action/           src/server/api/os/fulfillment/requests/[requestId]/action/POST.ts
// GET  /api/os/groups/                                           src/server/api/os/groups/GET.ts
// GET  /api/os/inventory/                                        src/server/api/os/inventory/GET.ts
// POST /api/os/inventory/                                        src/server/api/os/inventory/POST.ts
// GET  /api/os/inventory/movements/                              src/server/api/os/inventory/movements/GET.ts
// GET  /api/os/inventory/procurement/orders/                     src/server/api/os/inventory/procurement/orders/GET.ts
// POST /api/os/inventory/procurement/orders/                     src/server/api/os/inventory/procurement/orders/POST.ts
// POST /api/os/inventory/procurement/orders/:orderId/receive/    src/server/api/os/inventory/procurement/orders/[orderId]/receive/POST.ts
// PUT  /api/os/inventory/:itemId/                                src/server/api/os/inventory/[itemId]/PUT.ts
// GET  /api/os/lab/drafts/                                       src/server/api/os/lab/drafts/GET.ts
// POST /api/os/lab/drafts/                                       src/server/api/os/lab/drafts/POST.ts
// GET  /api/os/lab/handoff-audit/                                src/server/api/os/lab/handoff-audit/GET.ts
// POST /api/os/lab/handoff-audit/                                src/server/api/os/lab/handoff-audit/POST.ts
// GET  /api/os/library/hardware/                                 src/server/api/os/library/hardware/GET.ts
// GET  /api/os/locations/                                        src/server/api/os/locations/GET.ts
// PUT  /api/os/locations/                                        src/server/api/os/locations/PUT.ts
// GET  /api/os/nodes/                                            src/server/api/os/nodes/GET.ts
// GET  /api/os/notifications/                                    src/server/api/os/notifications/GET.ts
// POST /api/os/notifications/                                    src/server/api/os/notifications/POST.ts
// GET  /api/os/package-lots/                                     src/server/api/os/package-lots/GET.ts
// POST /api/os/package-lots/                                     src/server/api/os/package-lots/POST.ts
// POST /api/os/package-lots/:lotId/action/                       src/server/api/os/package-lots/[lotId]/action/POST.ts
// POST /api/os/packaging/reconcile/                              src/server/api/os/packaging/reconcile/POST.ts
// GET  /api/os/packaging/runs/                                   src/server/api/os/packaging/runs/GET.ts
// POST /api/os/packaging/runs/                                   src/server/api/os/packaging/runs/POST.ts
// POST /api/os/packaging/runs/:runId/action/                     src/server/api/os/packaging/runs/[runId]/action/POST.ts
// GET  /api/os/products/                                         src/server/api/os/products/GET.ts
// POST /api/os/products/                                         src/server/api/os/products/POST.ts
// GET  /api/os/products/media/:assetId/:variant/                 src/server/api/os/products/media/[assetId]/[variant]/GET.ts
// PUT  /api/os/products/:productId/                              src/server/api/os/products/[productId]/PUT.ts
// GET  /api/os/recipes/                                          src/server/api/os/recipes/GET.ts
// POST /api/os/recipes/                                          src/server/api/os/recipes/POST.ts
// GET  /api/os/recipes/equipment-map/                            src/server/api/os/recipes/equipment-map/GET.ts
// PUT  /api/os/recipes/equipment-map/                            src/server/api/os/recipes/equipment-map/PUT.ts
// POST /api/os/recipes/import/                                   src/server/api/os/recipes/import/POST.ts
// POST /api/os/recipes/inbox/scan/                               src/server/api/os/recipes/inbox/scan/POST.ts
// GET  /api/os/recipes/inbox/status/                             src/server/api/os/recipes/inbox/status/GET.ts
// POST /api/os/recipes/preflight/                                src/server/api/os/recipes/preflight/POST.ts
// POST /api/os/recipes/run/start/                                src/server/api/os/recipes/run/start/POST.ts
// POST /api/os/recipes/run/:runId/action/                        src/server/api/os/recipes/run/[runId]/action/POST.ts
// GET  /api/os/recipes/run/:runId/readings/                      src/server/api/os/recipes/run/[runId]/readings/GET.ts
// POST /api/os/recipes/run/:runId/readings/                      src/server/api/os/recipes/run/[runId]/readings/POST.ts
// POST /api/os/recipes/run/:runId/readings/snapshot/             src/server/api/os/recipes/run/[runId]/readings/snapshot/POST.ts
// GET  /api/os/recipes/run/:runId/runboard/                      src/server/api/os/recipes/run/[runId]/runboard/GET.ts
// PUT  /api/os/recipes/run/:runId/runboard/                      src/server/api/os/recipes/run/[runId]/runboard/PUT.ts
// PUT  /api/os/recipes/run/:runId/steps/:stepId/                 src/server/api/os/recipes/run/[runId]/steps/[stepId]/PUT.ts
// POST /api/os/recipes/run/:runId/transfer/                      src/server/api/os/recipes/run/[runId]/transfer/POST.ts
// GET  /api/os/recipes/runs/                                     src/server/api/os/recipes/runs/GET.ts
// POST /api/os/recipes/runs/reset/                               src/server/api/os/recipes/runs/reset/POST.ts
// GET  /api/os/recipes/transfer-map/                             src/server/api/os/recipes/transfer-map/GET.ts
// PUT  /api/os/recipes/transfer-map/                             src/server/api/os/recipes/transfer-map/PUT.ts
// POST /api/os/recipes/transfer-map/autofill/                    src/server/api/os/recipes/transfer-map/autofill/POST.ts
// GET  /api/os/registry/devices/                                 src/server/api/os/registry/devices/GET.ts
// PUT  /api/os/registry/devices/                                 src/server/api/os/registry/devices/PUT.ts
// GET  /api/os/reports/artifacts/                                src/server/api/os/reports/artifacts/GET.ts
// GET  /api/os/reports/artifacts/:artifactId/                    src/server/api/os/reports/artifacts/[artifactId]/GET.ts
// POST /api/os/reports/export/                                   src/server/api/os/reports/export/POST.ts
// POST /api/os/reservations/                                     src/server/api/os/reservations/POST.ts
// POST /api/os/reservations/:reservationId/action/               src/server/api/os/reservations/[reservationId]/action/POST.ts
// GET  /api/os/settings/                                         src/server/api/os/settings/GET.ts
// PUT  /api/os/settings/                                         src/server/api/os/settings/PUT.ts
// GET  /api/os/telemetry/latest/                                 src/server/api/os/telemetry/latest/GET.ts
// GET  /api/os/tiles/                                            src/server/api/os/tiles/GET.ts
// GET  /api/os/tiles/:tileId/                                    src/server/api/os/tiles/[tileId]/GET.ts
// GET  /api/os/transfers/                                        src/server/api/os/transfers/GET.ts
// POST /api/os/transfers/                                        src/server/api/os/transfers/POST.ts
// POST /api/os/transfers/:runId/action/                          src/server/api/os/transfers/[runId]/action/POST.ts

const internal  = [
  API_000.default  && { cb: API_000.default , method: "get"  , route: "/calendar/events/"                                  , url: "/api/calendar/events/"                                  , source: "src/server/api/calendar/events/GET.ts"                                    },
  API_001.default  && { cb: API_001.default , method: "post" , route: "/calendar/events/"                                  , url: "/api/calendar/events/"                                  , source: "src/server/api/calendar/events/POST.ts"                                   },
  API_002.default  && { cb: API_002.default , method: "post" , route: "/commerce/create-checkout-session/"                 , url: "/api/commerce/create-checkout-session/"                 , source: "src/server/api/commerce/create-checkout-session/POST.ts"                  },
  API_003.default  && { cb: API_003.default , method: "get"  , route: "/health/"                                           , url: "/api/health/"                                           , source: "src/server/api/health/GET.ts"                                             },
  API_004.default  && { cb: API_004.default , method: "get"  , route: "/os/alarms/"                                        , url: "/api/os/alarms/"                                        , source: "src/server/api/os/alarms/GET.ts"                                          },
  API_005.default  && { cb: API_005.default , method: "post" , route: "/os/automation/preview/"                            , url: "/api/os/automation/preview/"                            , source: "src/server/api/os/automation/preview/POST.ts"                             },
  API_006.default  && { cb: API_006.default , method: "post" , route: "/os/automation/run/"                                , url: "/api/os/automation/run/"                                , source: "src/server/api/os/automation/run/POST.ts"                                 },
  API_007.default  && { cb: API_007.default , method: "post" , route: "/os/automation/run/:runId/stop/"                    , url: "/api/os/automation/run/:runId/stop/"                    , source: "src/server/api/os/automation/run/[runId]/stop/POST.ts"                    },
  API_008.default  && { cb: API_008.default , method: "get"  , route: "/os/automation/runs/"                               , url: "/api/os/automation/runs/"                               , source: "src/server/api/os/automation/runs/GET.ts"                                 },
  API_009.default  && { cb: API_009.default , method: "get"  , route: "/os/availability/"                                  , url: "/api/os/availability/"                                  , source: "src/server/api/os/availability/GET.ts"                                    },
  API_010.default  && { cb: API_010.default , method: "get"  , route: "/os/batches/"                                       , url: "/api/os/batches/"                                       , source: "src/server/api/os/batches/GET.ts"                                         },
  API_011.default  && { cb: API_011.default , method: "post" , route: "/os/batches/"                                       , url: "/api/os/batches/"                                       , source: "src/server/api/os/batches/POST.ts"                                        },
  API_012.default  && { cb: API_012.default , method: "put"  , route: "/os/batches/:batchId/"                              , url: "/api/os/batches/:batchId/"                              , source: "src/server/api/os/batches/[batchId]/PUT.ts"                               },
  API_013.default  && { cb: API_013.default , method: "get"  , route: "/os/batches/:batchId/lineage/"                      , url: "/api/os/batches/:batchId/lineage/"                      , source: "src/server/api/os/batches/[batchId]/lineage/GET.ts"                       },
  API_014.default  && { cb: API_014.default , method: "get"  , route: "/os/bindings/"                                      , url: "/api/os/bindings/"                                      , source: "src/server/api/os/bindings/GET.ts"                                        },
  API_015.default  && { cb: API_015.default , method: "get"  , route: "/os/canvas/project/"                                , url: "/api/os/canvas/project/"                                , source: "src/server/api/os/canvas/project/GET.ts"                                  },
  API_016.default  && { cb: API_016.default , method: "put"  , route: "/os/canvas/project/"                                , url: "/api/os/canvas/project/"                                , source: "src/server/api/os/canvas/project/PUT.ts"                                  },
  API_017.default  && { cb: API_017.default , method: "post" , route: "/os/command/"                                       , url: "/api/os/command/"                                       , source: "src/server/api/os/command/POST.ts"                                        },
  API_018.default  && { cb: API_018.default , method: "get"  , route: "/os/command/:commandId/"                            , url: "/api/os/command/:commandId/"                            , source: "src/server/api/os/command/[commandId]/GET.ts"                             },
  API_019.default  && { cb: API_019.default , method: "get"  , route: "/os/compliance/feed/"                               , url: "/api/os/compliance/feed/"                               , source: "src/server/api/os/compliance/feed/GET.ts"                                 },
  API_020.default  && { cb: API_020.default , method: "get"  , route: "/os/endpoints/"                                     , url: "/api/os/endpoints/"                                     , source: "src/server/api/os/endpoints/GET.ts"                                       },
  API_021.default  && { cb: API_021.default , method: "get"  , route: "/os/flow/pour-events/"                              , url: "/api/os/flow/pour-events/"                              , source: "src/server/api/os/flow/pour-events/GET.ts"                                },
  API_022.default  && { cb: API_022.default , method: "post" , route: "/os/flow/pour-events/"                              , url: "/api/os/flow/pour-events/"                              , source: "src/server/api/os/flow/pour-events/POST.ts"                               },
  API_023.default  && { cb: API_023.default , method: "get"  , route: "/os/flow/profile/"                                  , url: "/api/os/flow/profile/"                                  , source: "src/server/api/os/flow/profile/GET.ts"                                    },
  API_024.default  && { cb: API_024.default , method: "get"  , route: "/os/flow/profiles/"                                 , url: "/api/os/flow/profiles/"                                 , source: "src/server/api/os/flow/profiles/GET.ts"                                   },
  API_025.default  && { cb: API_025.default , method: "post" , route: "/os/flow/publish/"                                  , url: "/api/os/flow/publish/"                                  , source: "src/server/api/os/flow/publish/POST.ts"                                   },
  API_026.default  && { cb: API_026.default , method: "get"  , route: "/os/flow/runtime-state/"                            , url: "/api/os/flow/runtime-state/"                            , source: "src/server/api/os/flow/runtime-state/GET.ts"                              },
  API_027.default  && { cb: API_027.default , method: "post" , route: "/os/flow/runtime-state/"                            , url: "/api/os/flow/runtime-state/"                            , source: "src/server/api/os/flow/runtime-state/POST.ts"                             },
  API_028.default  && { cb: API_028.default , method: "get"  , route: "/os/fulfillment/outbox/"                            , url: "/api/os/fulfillment/outbox/"                            , source: "src/server/api/os/fulfillment/outbox/GET.ts"                              },
  API_029.default  && { cb: API_029.default , method: "get"  , route: "/os/fulfillment/requests/"                          , url: "/api/os/fulfillment/requests/"                          , source: "src/server/api/os/fulfillment/requests/GET.ts"                            },
  API_030.default  && { cb: API_030.default , method: "post" , route: "/os/fulfillment/requests/"                          , url: "/api/os/fulfillment/requests/"                          , source: "src/server/api/os/fulfillment/requests/POST.ts"                           },
  API_031.default  && { cb: API_031.default , method: "post" , route: "/os/fulfillment/requests/:requestId/action/"        , url: "/api/os/fulfillment/requests/:requestId/action/"        , source: "src/server/api/os/fulfillment/requests/[requestId]/action/POST.ts"        },
  API_032.default  && { cb: API_032.default , method: "get"  , route: "/os/groups/"                                        , url: "/api/os/groups/"                                        , source: "src/server/api/os/groups/GET.ts"                                          },
  API_033.default  && { cb: API_033.default , method: "get"  , route: "/os/inventory/"                                     , url: "/api/os/inventory/"                                     , source: "src/server/api/os/inventory/GET.ts"                                       },
  API_034.default  && { cb: API_034.default , method: "post" , route: "/os/inventory/"                                     , url: "/api/os/inventory/"                                     , source: "src/server/api/os/inventory/POST.ts"                                      },
  API_035.default  && { cb: API_035.default , method: "get"  , route: "/os/inventory/movements/"                           , url: "/api/os/inventory/movements/"                           , source: "src/server/api/os/inventory/movements/GET.ts"                             },
  API_036.default  && { cb: API_036.default , method: "get"  , route: "/os/inventory/procurement/orders/"                  , url: "/api/os/inventory/procurement/orders/"                  , source: "src/server/api/os/inventory/procurement/orders/GET.ts"                    },
  API_037.default  && { cb: API_037.default , method: "post" , route: "/os/inventory/procurement/orders/"                  , url: "/api/os/inventory/procurement/orders/"                  , source: "src/server/api/os/inventory/procurement/orders/POST.ts"                   },
  API_038.default  && { cb: API_038.default , method: "post" , route: "/os/inventory/procurement/orders/:orderId/receive/" , url: "/api/os/inventory/procurement/orders/:orderId/receive/" , source: "src/server/api/os/inventory/procurement/orders/[orderId]/receive/POST.ts" },
  API_039.default  && { cb: API_039.default , method: "put"  , route: "/os/inventory/:itemId/"                             , url: "/api/os/inventory/:itemId/"                             , source: "src/server/api/os/inventory/[itemId]/PUT.ts"                              },
  API_040.default  && { cb: API_040.default , method: "get"  , route: "/os/lab/drafts/"                                    , url: "/api/os/lab/drafts/"                                    , source: "src/server/api/os/lab/drafts/GET.ts"                                      },
  API_041.default  && { cb: API_041.default , method: "post" , route: "/os/lab/drafts/"                                    , url: "/api/os/lab/drafts/"                                    , source: "src/server/api/os/lab/drafts/POST.ts"                                     },
  API_042.default  && { cb: API_042.default , method: "get"  , route: "/os/lab/handoff-audit/"                             , url: "/api/os/lab/handoff-audit/"                             , source: "src/server/api/os/lab/handoff-audit/GET.ts"                               },
  API_043.default  && { cb: API_043.default , method: "post" , route: "/os/lab/handoff-audit/"                             , url: "/api/os/lab/handoff-audit/"                             , source: "src/server/api/os/lab/handoff-audit/POST.ts"                              },
  API_044.default  && { cb: API_044.default , method: "get"  , route: "/os/library/hardware/"                              , url: "/api/os/library/hardware/"                              , source: "src/server/api/os/library/hardware/GET.ts"                                },
  API_045.default  && { cb: API_045.default , method: "get"  , route: "/os/locations/"                                     , url: "/api/os/locations/"                                     , source: "src/server/api/os/locations/GET.ts"                                       },
  API_046.default  && { cb: API_046.default , method: "put"  , route: "/os/locations/"                                     , url: "/api/os/locations/"                                     , source: "src/server/api/os/locations/PUT.ts"                                       },
  API_047.default  && { cb: API_047.default , method: "get"  , route: "/os/nodes/"                                         , url: "/api/os/nodes/"                                         , source: "src/server/api/os/nodes/GET.ts"                                           },
  API_048.default  && { cb: API_048.default , method: "get"  , route: "/os/notifications/"                                 , url: "/api/os/notifications/"                                 , source: "src/server/api/os/notifications/GET.ts"                                   },
  API_049.default  && { cb: API_049.default , method: "post" , route: "/os/notifications/"                                 , url: "/api/os/notifications/"                                 , source: "src/server/api/os/notifications/POST.ts"                                  },
  API_050.default  && { cb: API_050.default , method: "get"  , route: "/os/package-lots/"                                  , url: "/api/os/package-lots/"                                  , source: "src/server/api/os/package-lots/GET.ts"                                    },
  API_051.default  && { cb: API_051.default , method: "post" , route: "/os/package-lots/"                                  , url: "/api/os/package-lots/"                                  , source: "src/server/api/os/package-lots/POST.ts"                                   },
  API_052.default  && { cb: API_052.default , method: "post" , route: "/os/package-lots/:lotId/action/"                    , url: "/api/os/package-lots/:lotId/action/"                    , source: "src/server/api/os/package-lots/[lotId]/action/POST.ts"                    },
  API_053.default  && { cb: API_053.default , method: "post" , route: "/os/packaging/reconcile/"                           , url: "/api/os/packaging/reconcile/"                           , source: "src/server/api/os/packaging/reconcile/POST.ts"                            },
  API_054.default  && { cb: API_054.default , method: "get"  , route: "/os/packaging/runs/"                                , url: "/api/os/packaging/runs/"                                , source: "src/server/api/os/packaging/runs/GET.ts"                                  },
  API_055.default  && { cb: API_055.default , method: "post" , route: "/os/packaging/runs/"                                , url: "/api/os/packaging/runs/"                                , source: "src/server/api/os/packaging/runs/POST.ts"                                 },
  API_056.default  && { cb: API_056.default , method: "post" , route: "/os/packaging/runs/:runId/action/"                  , url: "/api/os/packaging/runs/:runId/action/"                  , source: "src/server/api/os/packaging/runs/[runId]/action/POST.ts"                  },
  API_057.default  && { cb: API_057.default , method: "get"  , route: "/os/products/"                                      , url: "/api/os/products/"                                      , source: "src/server/api/os/products/GET.ts"                                        },
  API_058.default  && { cb: API_058.default , method: "post" , route: "/os/products/"                                      , url: "/api/os/products/"                                      , source: "src/server/api/os/products/POST.ts"                                       },
  API_059.default  && { cb: API_059.default , method: "get"  , route: "/os/products/media/:assetId/:variant/"              , url: "/api/os/products/media/:assetId/:variant/"              , source: "src/server/api/os/products/media/[assetId]/[variant]/GET.ts"              },
  API_060.default  && { cb: API_060.default , method: "put"  , route: "/os/products/:productId/"                           , url: "/api/os/products/:productId/"                           , source: "src/server/api/os/products/[productId]/PUT.ts"                            },
  API_061.default  && { cb: API_061.default , method: "get"  , route: "/os/recipes/"                                       , url: "/api/os/recipes/"                                       , source: "src/server/api/os/recipes/GET.ts"                                         },
  API_062.default  && { cb: API_062.default , method: "post" , route: "/os/recipes/"                                       , url: "/api/os/recipes/"                                       , source: "src/server/api/os/recipes/POST.ts"                                        },
  API_063.default  && { cb: API_063.default , method: "get"  , route: "/os/recipes/equipment-map/"                         , url: "/api/os/recipes/equipment-map/"                         , source: "src/server/api/os/recipes/equipment-map/GET.ts"                           },
  API_064.default  && { cb: API_064.default , method: "put"  , route: "/os/recipes/equipment-map/"                         , url: "/api/os/recipes/equipment-map/"                         , source: "src/server/api/os/recipes/equipment-map/PUT.ts"                           },
  API_065.default  && { cb: API_065.default , method: "post" , route: "/os/recipes/import/"                                , url: "/api/os/recipes/import/"                                , source: "src/server/api/os/recipes/import/POST.ts"                                 },
  API_066.default  && { cb: API_066.default , method: "post" , route: "/os/recipes/inbox/scan/"                            , url: "/api/os/recipes/inbox/scan/"                            , source: "src/server/api/os/recipes/inbox/scan/POST.ts"                             },
  API_067.default  && { cb: API_067.default , method: "get"  , route: "/os/recipes/inbox/status/"                          , url: "/api/os/recipes/inbox/status/"                          , source: "src/server/api/os/recipes/inbox/status/GET.ts"                            },
  API_068.default  && { cb: API_068.default , method: "post" , route: "/os/recipes/preflight/"                             , url: "/api/os/recipes/preflight/"                             , source: "src/server/api/os/recipes/preflight/POST.ts"                              },
  API_069.default  && { cb: API_069.default , method: "post" , route: "/os/recipes/run/start/"                             , url: "/api/os/recipes/run/start/"                             , source: "src/server/api/os/recipes/run/start/POST.ts"                              },
  API_070.default  && { cb: API_070.default , method: "post" , route: "/os/recipes/run/:runId/action/"                     , url: "/api/os/recipes/run/:runId/action/"                     , source: "src/server/api/os/recipes/run/[runId]/action/POST.ts"                     },
  API_071.default  && { cb: API_071.default , method: "get"  , route: "/os/recipes/run/:runId/readings/"                   , url: "/api/os/recipes/run/:runId/readings/"                   , source: "src/server/api/os/recipes/run/[runId]/readings/GET.ts"                    },
  API_072.default  && { cb: API_072.default , method: "post" , route: "/os/recipes/run/:runId/readings/"                   , url: "/api/os/recipes/run/:runId/readings/"                   , source: "src/server/api/os/recipes/run/[runId]/readings/POST.ts"                   },
  API_073.default  && { cb: API_073.default , method: "post" , route: "/os/recipes/run/:runId/readings/snapshot/"          , url: "/api/os/recipes/run/:runId/readings/snapshot/"          , source: "src/server/api/os/recipes/run/[runId]/readings/snapshot/POST.ts"          },
  API_074.default  && { cb: API_074.default , method: "get"  , route: "/os/recipes/run/:runId/runboard/"                   , url: "/api/os/recipes/run/:runId/runboard/"                   , source: "src/server/api/os/recipes/run/[runId]/runboard/GET.ts"                    },
  API_075.default  && { cb: API_075.default , method: "put"  , route: "/os/recipes/run/:runId/runboard/"                   , url: "/api/os/recipes/run/:runId/runboard/"                   , source: "src/server/api/os/recipes/run/[runId]/runboard/PUT.ts"                    },
  API_076.default  && { cb: API_076.default , method: "put"  , route: "/os/recipes/run/:runId/steps/:stepId/"              , url: "/api/os/recipes/run/:runId/steps/:stepId/"              , source: "src/server/api/os/recipes/run/[runId]/steps/[stepId]/PUT.ts"              },
  API_077.default  && { cb: API_077.default , method: "post" , route: "/os/recipes/run/:runId/transfer/"                   , url: "/api/os/recipes/run/:runId/transfer/"                   , source: "src/server/api/os/recipes/run/[runId]/transfer/POST.ts"                   },
  API_078.default  && { cb: API_078.default , method: "get"  , route: "/os/recipes/runs/"                                  , url: "/api/os/recipes/runs/"                                  , source: "src/server/api/os/recipes/runs/GET.ts"                                    },
  API_079.default  && { cb: API_079.default , method: "post" , route: "/os/recipes/runs/reset/"                            , url: "/api/os/recipes/runs/reset/"                            , source: "src/server/api/os/recipes/runs/reset/POST.ts"                             },
  API_080.default  && { cb: API_080.default , method: "get"  , route: "/os/recipes/transfer-map/"                          , url: "/api/os/recipes/transfer-map/"                          , source: "src/server/api/os/recipes/transfer-map/GET.ts"                            },
  API_081.default  && { cb: API_081.default , method: "put"  , route: "/os/recipes/transfer-map/"                          , url: "/api/os/recipes/transfer-map/"                          , source: "src/server/api/os/recipes/transfer-map/PUT.ts"                            },
  API_082.default  && { cb: API_082.default , method: "post" , route: "/os/recipes/transfer-map/autofill/"                 , url: "/api/os/recipes/transfer-map/autofill/"                 , source: "src/server/api/os/recipes/transfer-map/autofill/POST.ts"                  },
  API_083.default  && { cb: API_083.default , method: "get"  , route: "/os/registry/devices/"                              , url: "/api/os/registry/devices/"                              , source: "src/server/api/os/registry/devices/GET.ts"                                },
  API_084.default  && { cb: API_084.default , method: "put"  , route: "/os/registry/devices/"                              , url: "/api/os/registry/devices/"                              , source: "src/server/api/os/registry/devices/PUT.ts"                                },
  API_085.default  && { cb: API_085.default , method: "get"  , route: "/os/reports/artifacts/"                             , url: "/api/os/reports/artifacts/"                             , source: "src/server/api/os/reports/artifacts/GET.ts"                               },
  API_086.default  && { cb: API_086.default , method: "get"  , route: "/os/reports/artifacts/:artifactId/"                 , url: "/api/os/reports/artifacts/:artifactId/"                 , source: "src/server/api/os/reports/artifacts/[artifactId]/GET.ts"                  },
  API_087.default  && { cb: API_087.default , method: "post" , route: "/os/reports/export/"                                , url: "/api/os/reports/export/"                                , source: "src/server/api/os/reports/export/POST.ts"                                 },
  API_088.default  && { cb: API_088.default , method: "post" , route: "/os/reservations/"                                  , url: "/api/os/reservations/"                                  , source: "src/server/api/os/reservations/POST.ts"                                   },
  API_089.default  && { cb: API_089.default , method: "post" , route: "/os/reservations/:reservationId/action/"            , url: "/api/os/reservations/:reservationId/action/"            , source: "src/server/api/os/reservations/[reservationId]/action/POST.ts"            },
  API_090.default  && { cb: API_090.default , method: "get"  , route: "/os/settings/"                                      , url: "/api/os/settings/"                                      , source: "src/server/api/os/settings/GET.ts"                                        },
  API_091.default  && { cb: API_091.default , method: "put"  , route: "/os/settings/"                                      , url: "/api/os/settings/"                                      , source: "src/server/api/os/settings/PUT.ts"                                        },
  API_092.default  && { cb: API_092.default , method: "get"  , route: "/os/telemetry/latest/"                              , url: "/api/os/telemetry/latest/"                              , source: "src/server/api/os/telemetry/latest/GET.ts"                                },
  API_093.default  && { cb: API_093.default , method: "get"  , route: "/os/tiles/"                                         , url: "/api/os/tiles/"                                         , source: "src/server/api/os/tiles/GET.ts"                                           },
  API_094.default  && { cb: API_094.default , method: "get"  , route: "/os/tiles/:tileId/"                                 , url: "/api/os/tiles/:tileId/"                                 , source: "src/server/api/os/tiles/[tileId]/GET.ts"                                  },
  API_095.default  && { cb: API_095.default , method: "get"  , route: "/os/transfers/"                                     , url: "/api/os/transfers/"                                     , source: "src/server/api/os/transfers/GET.ts"                                       },
  API_096.default  && { cb: API_096.default , method: "post" , route: "/os/transfers/"                                     , url: "/api/os/transfers/"                                     , source: "src/server/api/os/transfers/POST.ts"                                      },
  API_097.default  && { cb: API_097.default , method: "post" , route: "/os/transfers/:runId/action/"                       , url: "/api/os/transfers/:runId/action/"                       , source: "src/server/api/os/transfers/[runId]/action/POST.ts"                       }
].filter(it => it);

export const routers = internal.map((it) => {
  const { method, route, url, source } = it;
  return { method, url, route, source };
});

export const endpoints = internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

export const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = configure.callbackBefore?.(it.cb, it) || it.cb;
    applyRouter(it);
  });
};

