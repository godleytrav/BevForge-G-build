import type { ReactNode } from 'react';
import Website from '@/layouts/Website';
import type { HeaderConfig } from '@/layouts/parts/Header';
import type { FooterConfig } from '@/layouts/parts/Footer';

/**
 * Legacy root layout wrapper.
 *
 * BevForge route trees now own their own suite shell, so this wrapper intentionally
 * omits the old generic marketing header/footer. The config shape remains for
 * backwards compatibility with older imports.
 *
 * @param children - Child routes to render (typically <Outlet /> from react-router-dom)
 * @param config - Configuration for header and footer
 * @param config.header - Header configuration (logo, navigation, actions, etc.)
 * @param config.footer - Footer configuration (variant, links, social, etc.)
 *
 * @example
 * ```tsx
 * <RootLayout config={{
 *   header: {
 *     logo: { text: 'MyApp' },
 *     navItems: [{ href: '/', label: 'Home' }]
 *   },
 *   footer: {
 *     variant: 'simple'
 *   }
 * }}>
 *   <Outlet />
 * </RootLayout>
 * ```
 */
export interface RootLayoutConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
}

interface RootLayoutProps {
  children: ReactNode;
  config?: RootLayoutConfig;
}

export default function RootLayout({ children, config = {} }: RootLayoutProps) {
  void config;
  return (
    <Website>
      {children}
    </Website>
  );
}
