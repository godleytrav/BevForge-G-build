import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import AiroErrorBoundary from './components/AiroErrorBoundary';
import { routes } from './routes';
import Spinner from './components/Spinner';

const SpinnerFallback = () => (
  <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>
);

// BevForge OS uses Dashboard layout directly in pages
// No RootLayout wrapper - each page controls its own layout
const router = createBrowserRouter([
  {
    path: '/',
    element: import.meta.env.DEV ? (
      <AiroErrorBoundary>
        <Suspense fallback={<SpinnerFallback />}>
          <Outlet />
        </Suspense>
      </AiroErrorBoundary>
    ) : (
      <Suspense fallback={<SpinnerFallback />}>
        <Outlet />
      </Suspense>
    ),
    children: routes,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
