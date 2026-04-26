import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Route,
  ScanLine,
  Signal,
  Store,
} from "lucide-react";
import { useOpsMobile } from "./provider";

const navItems = [
  {
    href: "/ops/mobile",
    label: "Home",
    icon: Home,
  },
  {
    href: "/ops/mobile/routes",
    label: "Routes",
    icon: Route,
  },
  {
    href: "/ops/mobile/scan",
    label: "Scan",
    icon: ScanLine,
  },
  {
    href: "/ops/mobile/visits/new",
    label: "Visit",
    icon: Store,
  },
  {
    href: "/ops/mobile/sync",
    label: "Sync",
    icon: Signal,
  },
];

export function OpsMobileShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { state } = useOpsMobile();

  return (
    <div
      className="min-h-screen text-white"
      data-suite="ops"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(73, 227, 255, 0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(17, 94, 122, 0.2), transparent 42%), linear-gradient(180deg, rgba(4, 12, 18, 1) 0%, rgba(6, 18, 24, 0.98) 46%, rgba(8, 24, 31, 0.98) 100%)",
      }}
    >
      <main className="mx-auto max-w-5xl px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="space-y-4">
          <header className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-slate-950/30 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(73,227,255,0.28),transparent_55%),linear-gradient(160deg,rgba(5,16,22,0.98),rgba(7,24,31,0.88))] shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
                <div className="h-4 w-4 rounded-full border border-cyan-200/50 bg-cyan-300/80 shadow-[0_0_18px_rgba(103,232,249,0.65)]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/55">
                  BevForge
                </p>
                <p className="text-base font-semibold text-white">OPS Mobile</p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                state.isOnline
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-100"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  state.isOnline ? "bg-emerald-300" : "bg-amber-300"
                }`}
              />
              {state.isOnline ? "Online" : "Offline"}
            </div>
          </header>

          {state.error ? (
            <div className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {state.error}
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[26px] border border-white/12 bg-slate-950/80 px-2 py-2 shadow-[0_30px_70px_rgba(0,0,0,0.44)] backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.href ||
              (item.href !== "/ops/mobile" &&
                (location.pathname.startsWith(`${item.href}/`) ||
                  (item.href === "/ops/mobile/scan" &&
                    location.pathname.startsWith("/ops/mobile/lookup/"))));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                  active
                    ? "bg-cyan-300/18 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(165,243,252,0.25)]"
                    : "text-cyan-50/60 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
