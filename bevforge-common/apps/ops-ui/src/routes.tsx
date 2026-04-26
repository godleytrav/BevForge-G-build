import { Navigate, RouteObject } from "react-router-dom";
import { type ReactElement } from "react";
import { AppShell } from "@/components/AppShell";

// Direct imports instead of lazy loading
import IndexPage from "./pages/suites/bevforge/index";
import NotFoundPage from "./pages/_404";
import ConnectPage from "./pages/suites/connect/connect";
import ConnectInboxPage from "./pages/suites/connect/inbox";
import ConnectMessagesPage from "./pages/suites/connect/messages";
import ConnectEmployeesPage from "./pages/suites/connect/employees";
import ConnectTasksPage from "./pages/suites/connect/tasks";
import ConnectCampaignsPage from "./pages/suites/connect/campaigns";
import ConnectTimesheetsPage from "./pages/suites/connect/timesheets";
import ConnectAccountsPage from "./pages/suites/connect/accounts";
import ConnectContactsPage from "./pages/suites/connect/contacts";
import ConnectThreadsPage from "./pages/suites/connect/threads";
import FlowPage from "./pages/suites/flow/flow";
import FlowTapsPage from "./pages/suites/flow/taps";
import FlowKioskPage from "./pages/suites/flow/kiosk";
import FlowSessionsPage from "./pages/suites/flow/sessions";
import FlowAnalyticsPage from "./pages/suites/flow/analytics";
import LabPage from "./pages/suites/lab/lab";
import OpsPage from "./pages/suites/ops/ops";
import OsPage from "./pages/suites/os/os";
import ReportsPage from "./pages/reports";
import SettingsPage from "./pages/settings";
import ProfilePage from "./pages/profile";
import HelpPage from "./pages/help";
import CalendarPage from "./pages/suites/ops/calendar";
import NotificationsPage from "./pages/notifications";
import DirectoryPage from "./pages/suites/ops/directory";
import TasksPage from "./pages/suites/ops/tasks";

// OPS subpages
import OrdersPage from "./pages/ops/orders";
import BatchesPage from "./pages/ops/batches";
import SalesPage from "./pages/ops/sales";
import TaxPage from "./pages/ops/tax";
import CompliancePage from "./pages/ops/compliance";
import OpsReportsPage from "./pages/ops/reports";
import ProductsPage from "./pages/ops/products";
import InvoicingPage from "./pages/ops/invoicing";
import LabelsPage from "./pages/ops/labels";
import QualityPage from "./pages/ops/quality";
import ForecastPage from "./pages/ops/forecast";
import GoalsPlannerPage from "./pages/ops/goals";
import CanvasPage from "./pages/ops/canvas";
import CanvasDemoPage from "./pages/ops/canvas-demo";
import CanvasHybridPage from "./pages/ops/canvas-hybrid";
import CanvasV3Page from "./pages/ops/canvas-v3";
import CanvasLogisticsPage from "./pages/ops/canvas-logistics";
import OpsLogisticsSitesPage from "./pages/ops/logistics/sites";
import OpsLogisticsSiteDetailPage from "./pages/ops/logistics/site-detail";
import OpsLogisticsTrucksPage from "./pages/ops/logistics/trucks";
import OpsLogisticsTruckDetailPage from "./pages/ops/logistics/truck-detail";
import OpsLogisticsRoutesPage from "./pages/ops/logistics/routes";
import OpsLogisticsRouteDetailPage from "./pages/ops/logistics/route-detail";
import OpsLogisticsEventsPage from "./pages/ops/logistics/events";
import OpsLogisticsDriverPage from "./pages/ops/logistics/driver";
import OpsLogisticsDriverDetailPage from "./pages/ops/logistics/driver-detail";
import OpsCrmHomePage from "./pages/ops/crm";
import OpsCrmClientsPage from "./pages/ops/crm/clients";
import OpsCrmClientDetailPage from "./pages/ops/crm/client-detail";
import OpsCrmRecordDetailPage from "./pages/ops/crm/record-detail";
import OpsMobileLayout from "./pages/ops/mobile/layout";
import OpsMobileHomePage from "./pages/ops/mobile";
import OpsMobileRoutesPage from "./pages/ops/mobile/routes";
import OpsMobileRouteDetailPage from "./pages/ops/mobile/route-detail";
import OpsMobileStopDetailPage from "./pages/ops/mobile/stop-detail";
import OpsMobileScanPage from "./pages/ops/mobile/scan";
import OpsMobileLookupDetailPage from "./pages/ops/mobile/lookup-detail";
import OpsMobileVisitNewPage from "./pages/ops/mobile/visit-new";
import OpsMobileAccountDetailPage from "./pages/ops/mobile/account-detail";
import OpsMobileSyncPage from "./pages/ops/mobile/sync";

const withOpsShell = (
  pageTitle: string,
  element: ReactElement,
): ReactElement => (
  <AppShell currentSuite="ops" pageTitle={pageTitle}>
    {element}
  </AppShell>
);

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <IndexPage />,
  },
  {
    path: "/connect",
    element: <ConnectPage />,
  },
  {
    path: "/connect/inbox",
    element: <ConnectInboxPage />,
  },
  {
    path: "/connect/messages",
    element: <ConnectMessagesPage />,
  },
  {
    path: "/connect/employees",
    element: <ConnectEmployeesPage />,
  },
  {
    path: "/connect/tasks",
    element: <ConnectTasksPage />,
  },
  {
    path: "/connect/campaigns",
    element: <ConnectCampaignsPage />,
  },
  {
    path: "/connect/timesheets",
    element: <ConnectTimesheetsPage />,
  },
  {
    path: "/connect/accounts",
    element: <ConnectAccountsPage />,
  },
  {
    path: "/connect/contacts",
    element: <ConnectContactsPage />,
  },
  {
    path: "/connect/threads",
    element: <ConnectThreadsPage />,
  },
  {
    path: "/flow",
    element: <FlowPage />,
  },
  {
    path: "/flow/taps",
    element: <FlowTapsPage />,
  },
  {
    path: "/flow/kiosk",
    element: <FlowKioskPage />,
  },
  {
    path: "/flow/sessions",
    element: <FlowSessionsPage />,
  },
  {
    path: "/flow/analytics",
    element: <FlowAnalyticsPage />,
  },
  {
    path: "/flow/tap-board",
    element: <Navigate to="/flow/taps" replace />,
  },
  {
    path: "/flow/keg-assignments",
    element: <Navigate to="/flow/taps" replace />,
  },
  {
    path: "/flow/pour-stream",
    element: <Navigate to="/flow/analytics" replace />,
  },
  {
    path: "/flow/kiosk-menu",
    element: <Navigate to="/flow/kiosk" replace />,
  },
  {
    path: "/lab",
    element: <LabPage />,
  },
  {
    path: "/ops",
    element: <OpsPage />,
  },
  {
    path: "/ops/logistics",
    element: <CanvasLogisticsPage />,
  },
  {
    path: "/ops/logistics/canvas",
    element: <Navigate to="/ops/logistics" replace />,
  },
  {
    path: "/ops/logistics/sites",
    element: <OpsLogisticsSitesPage />,
  },
  {
    path: "/ops/logistics/sites/:siteId",
    element: <OpsLogisticsSiteDetailPage />,
  },
  {
    path: "/ops/logistics/trucks",
    element: <OpsLogisticsTrucksPage />,
  },
  {
    path: "/ops/logistics/trucks/:truckId",
    element: <OpsLogisticsTruckDetailPage />,
  },
  {
    path: "/ops/logistics/routes",
    element: <OpsLogisticsRoutesPage />,
  },
  {
    path: "/ops/logistics/routes/:routeId",
    element: <OpsLogisticsRouteDetailPage />,
  },
  {
    path: "/ops/logistics/events",
    element: <OpsLogisticsEventsPage />,
  },
  {
    path: "/ops/logistics/driver",
    element: <OpsLogisticsDriverPage />,
  },
  {
    path: "/ops/logistics/driver/:truckId",
    element: <OpsLogisticsDriverDetailPage />,
  },
  {
    path: "/ops/crm",
    element: <OpsCrmHomePage />,
  },
  {
    path: "/ops/crm/clients",
    element: <OpsCrmClientsPage />,
  },
  {
    path: "/ops/crm/clients/:clientId",
    element: <OpsCrmClientDetailPage />,
  },
  {
    path: "/ops/crm/records/:recordType/:recordId",
    element: <OpsCrmRecordDetailPage />,
  },
  {
    path: "/ops/mobile",
    element: <OpsMobileLayout />,
    children: [
      {
        index: true,
        element: <OpsMobileHomePage />,
      },
      {
        path: "routes",
        element: <OpsMobileRoutesPage />,
      },
      {
        path: "routes/:routeId",
        element: <OpsMobileRouteDetailPage />,
      },
      {
        path: "stops/:stopId",
        element: <OpsMobileStopDetailPage />,
      },
      {
        path: "scan",
        element: <OpsMobileScanPage />,
      },
      {
        path: "lookup/:identifier",
        element: <OpsMobileLookupDetailPage />,
      },
      {
        path: "visits/new",
        element: <OpsMobileVisitNewPage />,
      },
      {
        path: "accounts/:accountId",
        element: <OpsMobileAccountDetailPage />,
      },
      {
        path: "sync",
        element: <OpsMobileSyncPage />,
      },
    ],
  },
  {
    path: "/ops/orders",
    element: <OrdersPage />,
  },
  {
    path: "/ops/inventory",
    element: <Navigate to="/ops/products?focus=inventory" replace />,
  },
  {
    path: "/ops/batches",
    element: withOpsShell("OPS Batches", <BatchesPage />),
  },
  {
    path: "/ops/sales",
    element: <SalesPage />,
  },
  {
    path: "/ops/tax",
    element: <TaxPage />,
  },
  {
    path: "/ops/compliance",
    element: withOpsShell("OPS Compliance", <CompliancePage />),
  },
  {
    path: "/ops/reports",
    element: withOpsShell("OPS Reports", <OpsReportsPage />),
  },
  {
    path: "/ops/products",
    element: withOpsShell("OPS Product Workspace", <ProductsPage />),
  },
  {
    path: "/ops/invoicing",
    element: withOpsShell("OPS Invoicing", <InvoicingPage />),
  },
  {
    path: "/ops/labels",
    element: withOpsShell("OPS Labels", <LabelsPage />),
  },
  {
    path: "/ops/recipes",
    element: <Navigate to="/ops/products?focus=recipes" replace />,
  },
  {
    path: "/ops/quality",
    element: withOpsShell("OPS Quality", <QualityPage />),
  },
  {
    path: "/ops/forecast",
    element: <ForecastPage />,
  },
  {
    path: "/ops/goals",
    element: <GoalsPlannerPage />,
  },
  {
    path: "/ops/planning",
    element: <Navigate to="/ops/goals" replace />,
  },
  {
    path: "/ops/canvas",
    element: withOpsShell("OPS Canvas", <CanvasPage />),
  },
  {
    path: "/ops/canvas-classic",
    element: withOpsShell("OPS Canvas", <CanvasPage />),
  },
  {
    path: "/ops/canvas-demo",
    element: withOpsShell("OPS Canvas Demo", <CanvasDemoPage />),
  },
  {
    path: "/ops/canvas-hybrid",
    element: withOpsShell("OPS Canvas Hybrid", <CanvasHybridPage />),
  },
  {
    path: "/ops/canvas-v3",
    element: withOpsShell("OPS Canvas V3", <CanvasV3Page />),
  },
  {
    path: "/ops/canvas-logistics",
    element: <Navigate to="/ops/logistics" replace />,
  },
  {
    path: "/directory",
    element: <DirectoryPage />,
  },
  {
    path: "/tasks",
    element: <TasksPage />,
  },
  {
    path: "/os",
    element: <OsPage />,
  },
  {
    path: "/reports",
    element: <ReportsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/help",
    element: <HelpPage />,
  },
  {
    path: "/calendar",
    element: <CalendarPage />,
  },
  {
    path: "/calender",
    element: <Navigate to="/calendar?suite=ops" replace />,
  },
  {
    path: "/ops/calender",
    element: <Navigate to="/calendar?suite=ops" replace />,
  },
  {
    path: "/ops/calendar",
    element: <Navigate to="/calendar?suite=ops" replace />,
  },
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
