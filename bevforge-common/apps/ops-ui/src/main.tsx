import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';

const ensureHeadTag = (
  selector: string,
  create: () => HTMLElement,
): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.head.querySelector(selector);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const node = create();
  document.head.appendChild(node);
  return node;
};

const removeHeadTag = (selector: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.head.querySelector(selector)?.remove();
};

const applyScopedPwaHead = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      pathname: '/',
      mobileContext: false,
      driverContext: false,
    };
  }

  const pathname = window.location.pathname || '/';
  const mobileContext = pathname.startsWith('/ops/mobile');
  const driverContext = pathname.startsWith('/ops/logistics/driver');
  const theme = ensureHeadTag('meta[name="theme-color"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    return meta;
  });
  const appleTitle = ensureHeadTag('meta[name="apple-mobile-web-app-title"]', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'apple-mobile-web-app-title');
    return meta;
  });

  if (mobileContext) {
    const manifest = ensureHeadTag('link[rel="manifest"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'manifest');
      return link;
    });
    manifest?.setAttribute('href', '/ops/mobile/manifest.webmanifest');
    theme?.setAttribute('content', '#07131a');
    appleTitle?.setAttribute('content', 'OPS Mobile');
    document.title = 'OPS Mobile';
  } else if (driverContext) {
    const manifest = ensureHeadTag('link[rel="manifest"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'manifest');
      return link;
    });
    manifest?.setAttribute('href', '/ops-driver.webmanifest');
    theme?.setAttribute('content', '#0A1116');
    appleTitle?.setAttribute('content', 'OPS Driver');
    document.title = 'OPS Driver';
  } else {
    removeHeadTag('link[rel="manifest"]');
    theme?.setAttribute('content', '#0A1116');
    appleTitle?.setAttribute('content', 'BevForge OPS');
    document.title = 'BevForge OPS';
  }

  return {
    pathname,
    mobileContext,
    driverContext,
  };
};

// Add robots meta tag only in development mode
if (import.meta.env.DEV) {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}

const pwaContext = applyScopedPwaHead();

// Hot reload is handled by Vite automatically
if (
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  (window.isSecureContext || window.location.hostname === 'localhost')
) {
  if (pwaContext.mobileContext) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/ops/mobile/sw.js', {
        scope: '/ops/mobile/',
      });
    });
  } else if (pwaContext.driverContext) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/ops-driver-sw.js');
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Support both client-side navigation and SSR hydration
const rootElement = document.getElementById('app');
if (!rootElement) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
