import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AppErrorBoundary from './components/AppErrorBoundary';
import { routes } from './routes';
import Spinner from './components/Spinner';
import { NotificationProvider } from './contexts/NotificationContext';

const SpinnerFallback = () => (
  <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>
);

// BevForge routes own their own shell/layout; do not wrap them with the legacy site header.
const router = createBrowserRouter([
  {
    path: '/',
    element: import.meta.env.DEV ? (
      <AppErrorBoundary>
        <Suspense fallback={<SpinnerFallback />}>
          <Outlet />
        </Suspense>
      </AppErrorBoundary>
    ) : (
      <Suspense fallback={<SpinnerFallback />}>
        <Outlet />
      </Suspense>
    ),
    children: routes,
  },
]);

export default function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );
}
