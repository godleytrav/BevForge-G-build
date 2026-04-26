import { ReactElement } from 'react';
import Website from '@/layouts/Website';

/**
 * Legacy root layout wrapper.
 *
 * BevForge pages own their own suite shell, so this wrapper intentionally omits
 * the old generic marketing header/footer.
 *
 * @param children - Child routes to render (typically <Outlet /> from react-router-dom)
 *
 * @example
 * ```tsx
 * <RootLayout>
 *   <Outlet />
 * </RootLayout>
 * ```
 */
interface RootLayoutProps {
  children: ReactElement;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Website>
      {children}
    </Website>
  );
}
