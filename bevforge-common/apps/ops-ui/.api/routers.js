
// Files Imports
import * as configure from "@api/configure";
import * as API_000 from "@api/root/src/server/api/batches/GET.ts";
import * as API_001 from "@api/root/src/server/api/calendar/events/GET.ts";
import * as API_002 from "@api/root/src/server/api/calendar/events/POST.ts";
import * as API_003 from "@api/root/src/server/api/canvas/alerts/GET.ts";
import * as API_004 from "@api/root/src/server/api/canvas/locations/GET.ts";
import * as API_005 from "@api/root/src/server/api/canvas/pallets/POST.ts";
import * as API_006 from "@api/root/src/server/api/canvas/pallets/[palletId]/containers/POST.ts";
import * as API_007 from "@api/root/src/server/api/compliance/events/GET.ts";
import * as API_008 from "@api/root/src/server/api/compliance/events/POST.ts";
import * as API_009 from "@api/root/src/server/api/compliance/reports/GET.ts";
import * as API_010 from "@api/root/src/server/api/compliance/reports/POST.ts";
import * as API_011 from "@api/root/src/server/api/compliance/sync/POST.ts";
import * as API_012 from "@api/root/src/server/api/connect/accounts/POST.ts";
import * as API_013 from "@api/root/src/server/api/connect/campaigns/GET.ts";
import * as API_014 from "@api/root/src/server/api/connect/campaigns/POST.ts";
import * as API_015 from "@api/root/src/server/api/connect/campaigns/[campaignId]/status/PATCH.ts";
import * as API_016 from "@api/root/src/server/api/connect/contacts/POST.ts";
import * as API_017 from "@api/root/src/server/api/connect/employees/GET.ts";
import * as API_018 from "@api/root/src/server/api/connect/employees/POST.ts";
import * as API_019 from "@api/root/src/server/api/connect/employees/[employeeId]/PATCH.ts";
import * as API_020 from "@api/root/src/server/api/connect/import/ops-crm/POST.ts";
import * as API_021 from "@api/root/src/server/api/connect/overview/GET.ts";
import * as API_022 from "@api/root/src/server/api/connect/tasks/POST.ts";
import * as API_023 from "@api/root/src/server/api/connect/tasks/[taskId]/status/PATCH.ts";
import * as API_024 from "@api/root/src/server/api/connect/threads/POST.ts";
import * as API_025 from "@api/root/src/server/api/connect/threads/[threadId]/messages/POST.ts";
import * as API_026 from "@api/root/src/server/api/connect/threads/[threadId]/status/PATCH.ts";
import * as API_027 from "@api/root/src/server/api/connect/timesheets/GET.ts";
import * as API_028 from "@api/root/src/server/api/connect/timesheets/POST.ts";
import * as API_029 from "@api/root/src/server/api/connect/timesheets/[entryId]/clock-out/POST.ts";
import * as API_030 from "@api/root/src/server/api/connect/timesheets/[entryId]/status/PATCH.ts";
import * as API_031 from "@api/root/src/server/api/flow/pour-events/POST.ts";
import * as API_032 from "@api/root/src/server/api/flow/runtime/GET.ts";
import * as API_033 from "@api/root/src/server/api/flow/sync/POST.ts";
import * as API_034 from "@api/root/src/server/api/goals/scenarios/GET.ts";
import * as API_035 from "@api/root/src/server/api/goals/scenarios/POST.ts";
import * as API_036 from "@api/root/src/server/api/goals/scenarios/active/POST.ts";
import * as API_037 from "@api/root/src/server/api/goals/scenarios/duplicate/POST.ts";
import * as API_038 from "@api/root/src/server/api/goals/scenarios/reset/POST.ts";
import * as API_039 from "@api/root/src/server/api/health/GET.ts";
import * as API_040 from "@api/root/src/server/api/inventory/movements/GET.ts";
import * as API_041 from "@api/root/src/server/api/inventory/products/GET.ts";
import * as API_042 from "@api/root/src/server/api/ops/crm/certificates/POST.ts";
import * as API_043 from "@api/root/src/server/api/ops/crm/certificates/[clientId]/GET.ts";
import * as API_044 from "@api/root/src/server/api/ops/crm/certificates/[clientId]/content/GET.ts";
import * as API_045 from "@api/root/src/server/api/ops/crm/state/GET.ts";
import * as API_046 from "@api/root/src/server/api/ops/crm/state/POST.ts";
import * as API_047 from "@api/root/src/server/api/ops/driver/auth/dev-login/POST.ts";
import * as API_048 from "@api/root/src/server/api/ops/driver/auth/devices/revoke/POST.ts";
import * as API_049 from "@api/root/src/server/api/ops/driver/auth/logout/POST.ts";
import * as API_050 from "@api/root/src/server/api/ops/driver/auth/pair/POST.ts";
import * as API_051 from "@api/root/src/server/api/ops/driver/auth/pairing-codes/POST.ts";
import * as API_052 from "@api/root/src/server/api/ops/driver/auth/session/GET.ts";
import * as API_053 from "@api/root/src/server/api/ops/invoices/GET.ts";
import * as API_054 from "@api/root/src/server/api/ops/invoices/POST.ts";
import * as API_055 from "@api/root/src/server/api/ops/logistics/state/GET.ts";
import * as API_056 from "@api/root/src/server/api/ops/logistics/state/POST.ts";
import * as API_057 from "@api/root/src/server/api/ops/mobile/events/POST.ts";
import * as API_058 from "@api/root/src/server/api/ops/package-units/GET.ts";
import * as API_059 from "@api/root/src/server/api/ops/package-units/POST.ts";
import * as API_060 from "@api/root/src/server/api/orders/GET.ts";
import * as API_061 from "@api/root/src/server/api/orders/POST.ts";
import * as API_062 from "@api/root/src/server/api/orders/[orderId]/GET.ts";
import * as API_063 from "@api/root/src/server/api/orders/[orderId]/PATCH.ts";
import * as API_064 from "@api/root/src/server/api/orders/[orderId]/DELETE.ts";
import * as API_065 from "@api/root/src/server/api/os/alarms/GET.ts";
import * as API_066 from "@api/root/src/server/api/os/availability/GET.ts";
import * as API_067 from "@api/root/src/server/api/os/batches/GET.ts";
import * as API_068 from "@api/root/src/server/api/os/command/POST.ts";
import * as API_069 from "@api/root/src/server/api/os/compliance/feed/GET.ts";
import * as API_070 from "@api/root/src/server/api/os/endpoints/GET.ts";
import * as API_071 from "@api/root/src/server/api/os/inventory/GET.ts";
import * as API_072 from "@api/root/src/server/api/os/items/GET.ts";
import * as API_073 from "@api/root/src/server/api/os/library/hardware/GET.ts";
import * as API_074 from "@api/root/src/server/api/os/nodes/GET.ts";
import * as API_075 from "@api/root/src/server/api/os/package-lots/GET.ts";
import * as API_076 from "@api/root/src/server/api/os/products/GET.ts";
import * as API_077 from "@api/root/src/server/api/os/reservations/POST.ts";
import * as API_078 from "@api/root/src/server/api/os/reservations/[reservationId]/action/POST.ts";
import * as API_079 from "@api/root/src/server/api/os/tiles/GET.ts";
import * as API_080 from "@api/root/src/server/api/os/tiles/[tileId]/GET.ts";

// Public RESTful API Methods and Paths
// This section describes the available HTTP methods and their corresponding endpoints (paths).
// GET    /api/batches/                                   src/server/api/batches/GET.ts
// GET    /api/calendar/events/                           src/server/api/calendar/events/GET.ts
// POST   /api/calendar/events/                           src/server/api/calendar/events/POST.ts
// GET    /api/canvas/alerts/                             src/server/api/canvas/alerts/GET.ts
// GET    /api/canvas/locations/                          src/server/api/canvas/locations/GET.ts
// POST   /api/canvas/pallets/                            src/server/api/canvas/pallets/POST.ts
// POST   /api/canvas/pallets/:palletId/containers/       src/server/api/canvas/pallets/[palletId]/containers/POST.ts
// GET    /api/compliance/events/                         src/server/api/compliance/events/GET.ts
// POST   /api/compliance/events/                         src/server/api/compliance/events/POST.ts
// GET    /api/compliance/reports/                        src/server/api/compliance/reports/GET.ts
// POST   /api/compliance/reports/                        src/server/api/compliance/reports/POST.ts
// POST   /api/compliance/sync/                           src/server/api/compliance/sync/POST.ts
// POST   /api/connect/accounts/                          src/server/api/connect/accounts/POST.ts
// GET    /api/connect/campaigns/                         src/server/api/connect/campaigns/GET.ts
// POST   /api/connect/campaigns/                         src/server/api/connect/campaigns/POST.ts
// PATCH  /api/connect/campaigns/:campaignId/status/      src/server/api/connect/campaigns/[campaignId]/status/PATCH.ts
// POST   /api/connect/contacts/                          src/server/api/connect/contacts/POST.ts
// GET    /api/connect/employees/                         src/server/api/connect/employees/GET.ts
// POST   /api/connect/employees/                         src/server/api/connect/employees/POST.ts
// PATCH  /api/connect/employees/:employeeId/             src/server/api/connect/employees/[employeeId]/PATCH.ts
// POST   /api/connect/import/ops-crm/                    src/server/api/connect/import/ops-crm/POST.ts
// GET    /api/connect/overview/                          src/server/api/connect/overview/GET.ts
// POST   /api/connect/tasks/                             src/server/api/connect/tasks/POST.ts
// PATCH  /api/connect/tasks/:taskId/status/              src/server/api/connect/tasks/[taskId]/status/PATCH.ts
// POST   /api/connect/threads/                           src/server/api/connect/threads/POST.ts
// POST   /api/connect/threads/:threadId/messages/        src/server/api/connect/threads/[threadId]/messages/POST.ts
// PATCH  /api/connect/threads/:threadId/status/          src/server/api/connect/threads/[threadId]/status/PATCH.ts
// GET    /api/connect/timesheets/                        src/server/api/connect/timesheets/GET.ts
// POST   /api/connect/timesheets/                        src/server/api/connect/timesheets/POST.ts
// POST   /api/connect/timesheets/:entryId/clock-out/     src/server/api/connect/timesheets/[entryId]/clock-out/POST.ts
// PATCH  /api/connect/timesheets/:entryId/status/        src/server/api/connect/timesheets/[entryId]/status/PATCH.ts
// POST   /api/flow/pour-events/                          src/server/api/flow/pour-events/POST.ts
// GET    /api/flow/runtime/                              src/server/api/flow/runtime/GET.ts
// POST   /api/flow/sync/                                 src/server/api/flow/sync/POST.ts
// GET    /api/goals/scenarios/                           src/server/api/goals/scenarios/GET.ts
// POST   /api/goals/scenarios/                           src/server/api/goals/scenarios/POST.ts
// POST   /api/goals/scenarios/active/                    src/server/api/goals/scenarios/active/POST.ts
// POST   /api/goals/scenarios/duplicate/                 src/server/api/goals/scenarios/duplicate/POST.ts
// POST   /api/goals/scenarios/reset/                     src/server/api/goals/scenarios/reset/POST.ts
// GET    /api/health/                                    src/server/api/health/GET.ts
// GET    /api/inventory/movements/                       src/server/api/inventory/movements/GET.ts
// GET    /api/inventory/products/                        src/server/api/inventory/products/GET.ts
// POST   /api/ops/crm/certificates/                      src/server/api/ops/crm/certificates/POST.ts
// GET    /api/ops/crm/certificates/:clientId/            src/server/api/ops/crm/certificates/[clientId]/GET.ts
// GET    /api/ops/crm/certificates/:clientId/content/    src/server/api/ops/crm/certificates/[clientId]/content/GET.ts
// GET    /api/ops/crm/state/                             src/server/api/ops/crm/state/GET.ts
// POST   /api/ops/crm/state/                             src/server/api/ops/crm/state/POST.ts
// POST   /api/ops/driver/auth/dev-login/                 src/server/api/ops/driver/auth/dev-login/POST.ts
// POST   /api/ops/driver/auth/devices/revoke/            src/server/api/ops/driver/auth/devices/revoke/POST.ts
// POST   /api/ops/driver/auth/logout/                    src/server/api/ops/driver/auth/logout/POST.ts
// POST   /api/ops/driver/auth/pair/                      src/server/api/ops/driver/auth/pair/POST.ts
// POST   /api/ops/driver/auth/pairing-codes/             src/server/api/ops/driver/auth/pairing-codes/POST.ts
// GET    /api/ops/driver/auth/session/                   src/server/api/ops/driver/auth/session/GET.ts
// GET    /api/ops/invoices/                              src/server/api/ops/invoices/GET.ts
// POST   /api/ops/invoices/                              src/server/api/ops/invoices/POST.ts
// GET    /api/ops/logistics/state/                       src/server/api/ops/logistics/state/GET.ts
// POST   /api/ops/logistics/state/                       src/server/api/ops/logistics/state/POST.ts
// POST   /api/ops/mobile/events/                         src/server/api/ops/mobile/events/POST.ts
// GET    /api/ops/package-units/                         src/server/api/ops/package-units/GET.ts
// POST   /api/ops/package-units/                         src/server/api/ops/package-units/POST.ts
// GET    /api/orders/                                    src/server/api/orders/GET.ts
// POST   /api/orders/                                    src/server/api/orders/POST.ts
// GET    /api/orders/:orderId/                           src/server/api/orders/[orderId]/GET.ts
// PATCH  /api/orders/:orderId/                           src/server/api/orders/[orderId]/PATCH.ts
// DELETE /api/orders/:orderId/                           src/server/api/orders/[orderId]/DELETE.ts
// GET    /api/os/alarms/                                 src/server/api/os/alarms/GET.ts
// GET    /api/os/availability/                           src/server/api/os/availability/GET.ts
// GET    /api/os/batches/                                src/server/api/os/batches/GET.ts
// POST   /api/os/command/                                src/server/api/os/command/POST.ts
// GET    /api/os/compliance/feed/                        src/server/api/os/compliance/feed/GET.ts
// GET    /api/os/endpoints/                              src/server/api/os/endpoints/GET.ts
// GET    /api/os/inventory/                              src/server/api/os/inventory/GET.ts
// GET    /api/os/items/                                  src/server/api/os/items/GET.ts
// GET    /api/os/library/hardware/                       src/server/api/os/library/hardware/GET.ts
// GET    /api/os/nodes/                                  src/server/api/os/nodes/GET.ts
// GET    /api/os/package-lots/                           src/server/api/os/package-lots/GET.ts
// GET    /api/os/products/                               src/server/api/os/products/GET.ts
// POST   /api/os/reservations/                           src/server/api/os/reservations/POST.ts
// POST   /api/os/reservations/:reservationId/action/     src/server/api/os/reservations/[reservationId]/action/POST.ts
// GET    /api/os/tiles/                                  src/server/api/os/tiles/GET.ts
// GET    /api/os/tiles/:tileId/                          src/server/api/os/tiles/[tileId]/GET.ts

const internal  = [
  API_000.default  && { cb: API_000.default , method: "get"    , route: "/batches/"                                , url: "/api/batches/"                                , source: "src/server/api/batches/GET.ts"                                 },
  API_001.default  && { cb: API_001.default , method: "get"    , route: "/calendar/events/"                        , url: "/api/calendar/events/"                        , source: "src/server/api/calendar/events/GET.ts"                         },
  API_002.default  && { cb: API_002.default , method: "post"   , route: "/calendar/events/"                        , url: "/api/calendar/events/"                        , source: "src/server/api/calendar/events/POST.ts"                        },
  API_003.default  && { cb: API_003.default , method: "get"    , route: "/canvas/alerts/"                          , url: "/api/canvas/alerts/"                          , source: "src/server/api/canvas/alerts/GET.ts"                           },
  API_004.default  && { cb: API_004.default , method: "get"    , route: "/canvas/locations/"                       , url: "/api/canvas/locations/"                       , source: "src/server/api/canvas/locations/GET.ts"                        },
  API_005.default  && { cb: API_005.default , method: "post"   , route: "/canvas/pallets/"                         , url: "/api/canvas/pallets/"                         , source: "src/server/api/canvas/pallets/POST.ts"                         },
  API_006.default  && { cb: API_006.default , method: "post"   , route: "/canvas/pallets/:palletId/containers/"    , url: "/api/canvas/pallets/:palletId/containers/"    , source: "src/server/api/canvas/pallets/[palletId]/containers/POST.ts"   },
  API_007.default  && { cb: API_007.default , method: "get"    , route: "/compliance/events/"                      , url: "/api/compliance/events/"                      , source: "src/server/api/compliance/events/GET.ts"                       },
  API_008.default  && { cb: API_008.default , method: "post"   , route: "/compliance/events/"                      , url: "/api/compliance/events/"                      , source: "src/server/api/compliance/events/POST.ts"                      },
  API_009.default  && { cb: API_009.default , method: "get"    , route: "/compliance/reports/"                     , url: "/api/compliance/reports/"                     , source: "src/server/api/compliance/reports/GET.ts"                      },
  API_010.default  && { cb: API_010.default , method: "post"   , route: "/compliance/reports/"                     , url: "/api/compliance/reports/"                     , source: "src/server/api/compliance/reports/POST.ts"                     },
  API_011.default  && { cb: API_011.default , method: "post"   , route: "/compliance/sync/"                        , url: "/api/compliance/sync/"                        , source: "src/server/api/compliance/sync/POST.ts"                        },
  API_012.default  && { cb: API_012.default , method: "post"   , route: "/connect/accounts/"                       , url: "/api/connect/accounts/"                       , source: "src/server/api/connect/accounts/POST.ts"                       },
  API_013.default  && { cb: API_013.default , method: "get"    , route: "/connect/campaigns/"                      , url: "/api/connect/campaigns/"                      , source: "src/server/api/connect/campaigns/GET.ts"                       },
  API_014.default  && { cb: API_014.default , method: "post"   , route: "/connect/campaigns/"                      , url: "/api/connect/campaigns/"                      , source: "src/server/api/connect/campaigns/POST.ts"                      },
  API_015.default  && { cb: API_015.default , method: "patch"  , route: "/connect/campaigns/:campaignId/status/"   , url: "/api/connect/campaigns/:campaignId/status/"   , source: "src/server/api/connect/campaigns/[campaignId]/status/PATCH.ts" },
  API_016.default  && { cb: API_016.default , method: "post"   , route: "/connect/contacts/"                       , url: "/api/connect/contacts/"                       , source: "src/server/api/connect/contacts/POST.ts"                       },
  API_017.default  && { cb: API_017.default , method: "get"    , route: "/connect/employees/"                      , url: "/api/connect/employees/"                      , source: "src/server/api/connect/employees/GET.ts"                       },
  API_018.default  && { cb: API_018.default , method: "post"   , route: "/connect/employees/"                      , url: "/api/connect/employees/"                      , source: "src/server/api/connect/employees/POST.ts"                      },
  API_019.default  && { cb: API_019.default , method: "patch"  , route: "/connect/employees/:employeeId/"          , url: "/api/connect/employees/:employeeId/"          , source: "src/server/api/connect/employees/[employeeId]/PATCH.ts"        },
  API_020.default  && { cb: API_020.default , method: "post"   , route: "/connect/import/ops-crm/"                 , url: "/api/connect/import/ops-crm/"                 , source: "src/server/api/connect/import/ops-crm/POST.ts"                 },
  API_021.default  && { cb: API_021.default , method: "get"    , route: "/connect/overview/"                       , url: "/api/connect/overview/"                       , source: "src/server/api/connect/overview/GET.ts"                        },
  API_022.default  && { cb: API_022.default , method: "post"   , route: "/connect/tasks/"                          , url: "/api/connect/tasks/"                          , source: "src/server/api/connect/tasks/POST.ts"                          },
  API_023.default  && { cb: API_023.default , method: "patch"  , route: "/connect/tasks/:taskId/status/"           , url: "/api/connect/tasks/:taskId/status/"           , source: "src/server/api/connect/tasks/[taskId]/status/PATCH.ts"         },
  API_024.default  && { cb: API_024.default , method: "post"   , route: "/connect/threads/"                        , url: "/api/connect/threads/"                        , source: "src/server/api/connect/threads/POST.ts"                        },
  API_025.default  && { cb: API_025.default , method: "post"   , route: "/connect/threads/:threadId/messages/"     , url: "/api/connect/threads/:threadId/messages/"     , source: "src/server/api/connect/threads/[threadId]/messages/POST.ts"    },
  API_026.default  && { cb: API_026.default , method: "patch"  , route: "/connect/threads/:threadId/status/"       , url: "/api/connect/threads/:threadId/status/"       , source: "src/server/api/connect/threads/[threadId]/status/PATCH.ts"     },
  API_027.default  && { cb: API_027.default , method: "get"    , route: "/connect/timesheets/"                     , url: "/api/connect/timesheets/"                     , source: "src/server/api/connect/timesheets/GET.ts"                      },
  API_028.default  && { cb: API_028.default , method: "post"   , route: "/connect/timesheets/"                     , url: "/api/connect/timesheets/"                     , source: "src/server/api/connect/timesheets/POST.ts"                     },
  API_029.default  && { cb: API_029.default , method: "post"   , route: "/connect/timesheets/:entryId/clock-out/"  , url: "/api/connect/timesheets/:entryId/clock-out/"  , source: "src/server/api/connect/timesheets/[entryId]/clock-out/POST.ts" },
  API_030.default  && { cb: API_030.default , method: "patch"  , route: "/connect/timesheets/:entryId/status/"     , url: "/api/connect/timesheets/:entryId/status/"     , source: "src/server/api/connect/timesheets/[entryId]/status/PATCH.ts"   },
  API_031.default  && { cb: API_031.default , method: "post"   , route: "/flow/pour-events/"                       , url: "/api/flow/pour-events/"                       , source: "src/server/api/flow/pour-events/POST.ts"                       },
  API_032.default  && { cb: API_032.default , method: "get"    , route: "/flow/runtime/"                           , url: "/api/flow/runtime/"                           , source: "src/server/api/flow/runtime/GET.ts"                            },
  API_033.default  && { cb: API_033.default , method: "post"   , route: "/flow/sync/"                              , url: "/api/flow/sync/"                              , source: "src/server/api/flow/sync/POST.ts"                              },
  API_034.default  && { cb: API_034.default , method: "get"    , route: "/goals/scenarios/"                        , url: "/api/goals/scenarios/"                        , source: "src/server/api/goals/scenarios/GET.ts"                         },
  API_035.default  && { cb: API_035.default , method: "post"   , route: "/goals/scenarios/"                        , url: "/api/goals/scenarios/"                        , source: "src/server/api/goals/scenarios/POST.ts"                        },
  API_036.default  && { cb: API_036.default , method: "post"   , route: "/goals/scenarios/active/"                 , url: "/api/goals/scenarios/active/"                 , source: "src/server/api/goals/scenarios/active/POST.ts"                 },
  API_037.default  && { cb: API_037.default , method: "post"   , route: "/goals/scenarios/duplicate/"              , url: "/api/goals/scenarios/duplicate/"              , source: "src/server/api/goals/scenarios/duplicate/POST.ts"              },
  API_038.default  && { cb: API_038.default , method: "post"   , route: "/goals/scenarios/reset/"                  , url: "/api/goals/scenarios/reset/"                  , source: "src/server/api/goals/scenarios/reset/POST.ts"                  },
  API_039.default  && { cb: API_039.default , method: "get"    , route: "/health/"                                 , url: "/api/health/"                                 , source: "src/server/api/health/GET.ts"                                  },
  API_040.default  && { cb: API_040.default , method: "get"    , route: "/inventory/movements/"                    , url: "/api/inventory/movements/"                    , source: "src/server/api/inventory/movements/GET.ts"                     },
  API_041.default  && { cb: API_041.default , method: "get"    , route: "/inventory/products/"                     , url: "/api/inventory/products/"                     , source: "src/server/api/inventory/products/GET.ts"                      },
  API_042.default  && { cb: API_042.default , method: "post"   , route: "/ops/crm/certificates/"                   , url: "/api/ops/crm/certificates/"                   , source: "src/server/api/ops/crm/certificates/POST.ts"                   },
  API_043.default  && { cb: API_043.default , method: "get"    , route: "/ops/crm/certificates/:clientId/"         , url: "/api/ops/crm/certificates/:clientId/"         , source: "src/server/api/ops/crm/certificates/[clientId]/GET.ts"         },
  API_044.default  && { cb: API_044.default , method: "get"    , route: "/ops/crm/certificates/:clientId/content/" , url: "/api/ops/crm/certificates/:clientId/content/" , source: "src/server/api/ops/crm/certificates/[clientId]/content/GET.ts" },
  API_045.default  && { cb: API_045.default , method: "get"    , route: "/ops/crm/state/"                          , url: "/api/ops/crm/state/"                          , source: "src/server/api/ops/crm/state/GET.ts"                           },
  API_046.default  && { cb: API_046.default , method: "post"   , route: "/ops/crm/state/"                          , url: "/api/ops/crm/state/"                          , source: "src/server/api/ops/crm/state/POST.ts"                          },
  API_047.default  && { cb: API_047.default , method: "post"   , route: "/ops/driver/auth/dev-login/"              , url: "/api/ops/driver/auth/dev-login/"              , source: "src/server/api/ops/driver/auth/dev-login/POST.ts"              },
  API_048.default  && { cb: API_048.default , method: "post"   , route: "/ops/driver/auth/devices/revoke/"         , url: "/api/ops/driver/auth/devices/revoke/"         , source: "src/server/api/ops/driver/auth/devices/revoke/POST.ts"         },
  API_049.default  && { cb: API_049.default , method: "post"   , route: "/ops/driver/auth/logout/"                 , url: "/api/ops/driver/auth/logout/"                 , source: "src/server/api/ops/driver/auth/logout/POST.ts"                 },
  API_050.default  && { cb: API_050.default , method: "post"   , route: "/ops/driver/auth/pair/"                   , url: "/api/ops/driver/auth/pair/"                   , source: "src/server/api/ops/driver/auth/pair/POST.ts"                   },
  API_051.default  && { cb: API_051.default , method: "post"   , route: "/ops/driver/auth/pairing-codes/"          , url: "/api/ops/driver/auth/pairing-codes/"          , source: "src/server/api/ops/driver/auth/pairing-codes/POST.ts"          },
  API_052.default  && { cb: API_052.default , method: "get"    , route: "/ops/driver/auth/session/"                , url: "/api/ops/driver/auth/session/"                , source: "src/server/api/ops/driver/auth/session/GET.ts"                 },
  API_053.default  && { cb: API_053.default , method: "get"    , route: "/ops/invoices/"                           , url: "/api/ops/invoices/"                           , source: "src/server/api/ops/invoices/GET.ts"                            },
  API_054.default  && { cb: API_054.default , method: "post"   , route: "/ops/invoices/"                           , url: "/api/ops/invoices/"                           , source: "src/server/api/ops/invoices/POST.ts"                           },
  API_055.default  && { cb: API_055.default , method: "get"    , route: "/ops/logistics/state/"                    , url: "/api/ops/logistics/state/"                    , source: "src/server/api/ops/logistics/state/GET.ts"                     },
  API_056.default  && { cb: API_056.default , method: "post"   , route: "/ops/logistics/state/"                    , url: "/api/ops/logistics/state/"                    , source: "src/server/api/ops/logistics/state/POST.ts"                    },
  API_057.default  && { cb: API_057.default , method: "post"   , route: "/ops/mobile/events/"                      , url: "/api/ops/mobile/events/"                      , source: "src/server/api/ops/mobile/events/POST.ts"                      },
  API_058.default  && { cb: API_058.default , method: "get"    , route: "/ops/package-units/"                      , url: "/api/ops/package-units/"                      , source: "src/server/api/ops/package-units/GET.ts"                       },
  API_059.default  && { cb: API_059.default , method: "post"   , route: "/ops/package-units/"                      , url: "/api/ops/package-units/"                      , source: "src/server/api/ops/package-units/POST.ts"                      },
  API_060.default  && { cb: API_060.default , method: "get"    , route: "/orders/"                                 , url: "/api/orders/"                                 , source: "src/server/api/orders/GET.ts"                                  },
  API_061.default  && { cb: API_061.default , method: "post"   , route: "/orders/"                                 , url: "/api/orders/"                                 , source: "src/server/api/orders/POST.ts"                                 },
  API_062.default  && { cb: API_062.default , method: "get"    , route: "/orders/:orderId/"                        , url: "/api/orders/:orderId/"                        , source: "src/server/api/orders/[orderId]/GET.ts"                        },
  API_063.default  && { cb: API_063.default , method: "patch"  , route: "/orders/:orderId/"                        , url: "/api/orders/:orderId/"                        , source: "src/server/api/orders/[orderId]/PATCH.ts"                      },
  API_064.default  && { cb: API_064.default , method: "delete" , route: "/orders/:orderId/"                        , url: "/api/orders/:orderId/"                        , source: "src/server/api/orders/[orderId]/DELETE.ts"                     },
  API_065.default  && { cb: API_065.default , method: "get"    , route: "/os/alarms/"                              , url: "/api/os/alarms/"                              , source: "src/server/api/os/alarms/GET.ts"                               },
  API_066.default  && { cb: API_066.default , method: "get"    , route: "/os/availability/"                        , url: "/api/os/availability/"                        , source: "src/server/api/os/availability/GET.ts"                         },
  API_067.default  && { cb: API_067.default , method: "get"    , route: "/os/batches/"                             , url: "/api/os/batches/"                             , source: "src/server/api/os/batches/GET.ts"                              },
  API_068.default  && { cb: API_068.default , method: "post"   , route: "/os/command/"                             , url: "/api/os/command/"                             , source: "src/server/api/os/command/POST.ts"                             },
  API_069.default  && { cb: API_069.default , method: "get"    , route: "/os/compliance/feed/"                     , url: "/api/os/compliance/feed/"                     , source: "src/server/api/os/compliance/feed/GET.ts"                      },
  API_070.default  && { cb: API_070.default , method: "get"    , route: "/os/endpoints/"                           , url: "/api/os/endpoints/"                           , source: "src/server/api/os/endpoints/GET.ts"                            },
  API_071.default  && { cb: API_071.default , method: "get"    , route: "/os/inventory/"                           , url: "/api/os/inventory/"                           , source: "src/server/api/os/inventory/GET.ts"                            },
  API_072.default  && { cb: API_072.default , method: "get"    , route: "/os/items/"                               , url: "/api/os/items/"                               , source: "src/server/api/os/items/GET.ts"                                },
  API_073.default  && { cb: API_073.default , method: "get"    , route: "/os/library/hardware/"                    , url: "/api/os/library/hardware/"                    , source: "src/server/api/os/library/hardware/GET.ts"                     },
  API_074.default  && { cb: API_074.default , method: "get"    , route: "/os/nodes/"                               , url: "/api/os/nodes/"                               , source: "src/server/api/os/nodes/GET.ts"                                },
  API_075.default  && { cb: API_075.default , method: "get"    , route: "/os/package-lots/"                        , url: "/api/os/package-lots/"                        , source: "src/server/api/os/package-lots/GET.ts"                         },
  API_076.default  && { cb: API_076.default , method: "get"    , route: "/os/products/"                            , url: "/api/os/products/"                            , source: "src/server/api/os/products/GET.ts"                             },
  API_077.default  && { cb: API_077.default , method: "post"   , route: "/os/reservations/"                        , url: "/api/os/reservations/"                        , source: "src/server/api/os/reservations/POST.ts"                        },
  API_078.default  && { cb: API_078.default , method: "post"   , route: "/os/reservations/:reservationId/action/"  , url: "/api/os/reservations/:reservationId/action/"  , source: "src/server/api/os/reservations/[reservationId]/action/POST.ts" },
  API_079.default  && { cb: API_079.default , method: "get"    , route: "/os/tiles/"                               , url: "/api/os/tiles/"                               , source: "src/server/api/os/tiles/GET.ts"                                },
  API_080.default  && { cb: API_080.default , method: "get"    , route: "/os/tiles/:tileId/"                       , url: "/api/os/tiles/:tileId/"                       , source: "src/server/api/os/tiles/[tileId]/GET.ts"                       }
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

