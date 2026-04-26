import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import HomePage from './pages/index';
import HomeHubPage from './pages/HomeHubPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import ItemDetailsRouter from './pages/os/ItemDetailsRouter';
import ControlPanelPage from './pages/os/ControlPanelPage';
import RecipeExecutionPage from './pages/os/RecipeExecutionPage';
import BrewdayRunboardPage from './pages/os/BrewdayRunboardPage';
import AddInventoryItemPage from './pages/os/AddInventoryItemPage';
import DevicesPage from './pages/os/DevicesPage';
import InventoryManagementPage from './pages/os/InventoryManagementPage';
import InventoryReportPage from './pages/os/InventoryReportPage';
import InventoryOrdersPage from './pages/os/InventoryOrdersPage';
import BatchesPage from './pages/os/BatchesPage';
import NewBatchPage from './pages/os/NewBatchPage';
import FulfillmentRequestsPage from './pages/os/FulfillmentRequestsPage';
import TransfersPage from './pages/os/TransfersPage';
import PackagingPage from './pages/os/PackagingPage';
import PackagedProductsPage from './pages/os/PackagedProductsPage';
import CompliancePage from './pages/os/CompliancePage';
import ReportsPage from './pages/os/ReportsPage';
import LocationsPage from './pages/os/LocationsPage';
import SuiteRedirectPage from './pages/SuiteRedirectPage';
import SettingsPage from './pages/SettingsPage';

// Lazy load components for code splitting (except HomePage for instant loading)
const NotFoundPage = lazy(() => import('./pages/_404'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomeHubPage />,
  },
  {
    path: '/home',
    element: <HomeHubPage />,
  },
  {
    path: '/calendar',
    element: <CalendarPage />,
  },
  {
    path: '/notifications',
    element: <NotificationsPage />,
  },
  {
    path: '/reports',
    element: <ReportsPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/os',
    element: <HomePage />,
  },
  {
    path: '/os/calendar',
    element: <CalendarPage />,
  },
  {
    path: '/os/notifications',
    element: <NotificationsPage />,
  },
  {
    path: '/os/devices',
    element: <DevicesPage />,
  },
  {
    path: '/os/inventory',
    element: <InventoryManagementPage />,
  },
  {
    path: '/os/inventory/report',
    element: <InventoryReportPage />,
  },
  {
    path: '/os/inventory/add',
    element: <AddInventoryItemPage />,
  },
  {
    path: '/os/inventory/orders',
    element: <InventoryOrdersPage />,
  },
  {
    path: '/os/inventory/:id',
    element: <ItemDetailsRouter />,
  },
  {
    path: '/os/control-panel',
    element: <ControlPanelPage />,
  },
  {
    path: '/os/recipe-execution',
    element: <RecipeExecutionPage />,
  },
  {
    path: '/os/brewday',
    element: <BrewdayRunboardPage />,
  },
  {
    path: '/os/brewday/:runId',
    element: <BrewdayRunboardPage />,
  },
  {
    path: '/os/batches',
    element: <BatchesPage />,
  },
  {
    path: '/os/batches/:batchId',
    element: <BatchesPage />,
  },
  {
    path: '/os/batches/new',
    element: <NewBatchPage />,
  },
  {
    path: '/os/requests',
    element: <FulfillmentRequestsPage />,
  },
  {
    path: '/os/transfers',
    element: <TransfersPage />,
  },
  {
    path: '/os/packaging',
    element: <PackagingPage />,
  },
  {
    path: '/os/packaged-products',
    element: <PackagedProductsPage />,
  },
  {
    path: '/os/compliance',
    element: <CompliancePage />,
  },
  {
    path: '/os/reports',
    element: <ReportsPage />,
  },
  {
    path: '/os/settings',
    element: <SettingsPage />,
  },
  {
    path: '/os/materials',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/os/locations',
    element: <LocationsPage />,
  },
  {
    path: '/os/movements',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/ops',
    element: <SuiteRedirectPage suite="ops" />,
  },
  {
    path: '/lab',
    element: <SuiteRedirectPage suite="lab" />,
  },
  {
    path: '/connect',
    element: <SuiteRedirectPage suite="connect" />,
  },
  {
    path: '/flow',
    element: <SuiteRedirectPage suite="flow" />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/home' | '/calendar' | '/notifications' | '/reports' | '/settings' | '/os' | '/os/calendar' | '/os/notifications' | '/os/inventory' | '/os/inventory/report' | '/os/inventory/add' | '/os/inventory/orders' | '/os/inventory/:id' | '/os/control-panel' | '/os/recipe-execution' | '/os/brewday' | '/os/brewday/:runId' | '/os/batches' | '/os/batches/:batchId' | '/os/batches/new' | '/os/requests' | '/os/transfers' | '/os/packaging' | '/os/packaged-products' | '/os/compliance' | '/os/reports' | '/os/settings' | '/os/materials' | '/os/locations' | '/os/movements' | '/ops' | '/lab' | '/connect' | '/flow';

export type Params = Record<string, string | undefined>;
