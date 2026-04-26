import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { flowBadgeStyle, flowMutedPanelStyle } from "./theme";

interface FlowSuiteNavProps {
  counts?: {
    taps?: number;
    kiosk?: number;
    sessions?: number;
    analytics?: number;
  };
}

const navItems: Array<{
  route: string;
  label: string;
  key: keyof NonNullable<FlowSuiteNavProps["counts"]>;
}> = [
  { route: "/flow/taps", label: "Taps", key: "taps" },
  { route: "/flow/kiosk", label: "Kiosk", key: "kiosk" },
  { route: "/flow/sessions", label: "Sessions", key: "sessions" },
  { route: "/flow/analytics", label: "Analytics", key: "analytics" },
];

export function FlowSuiteNav({ counts }: FlowSuiteNavProps) {
  const location = useLocation();

  return (
    <div className="rounded-xl p-3" style={flowMutedPanelStyle}>
      <nav className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route;
          const count = counts?.[item.key];

          return (
            <Link
              key={item.route}
              to={item.route}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-green-300/70 bg-green-500/20 text-green-50 shadow-[0_0_14px_rgba(34,197,94,0.35)]"
                  : "border-green-400/30 bg-black/20 text-green-100 hover:border-green-300/60 hover:bg-green-500/15"
              }`}
            >
              <span>{item.label}</span>
              {typeof count === "number" && (
                <Badge style={flowBadgeStyle} className="text-[10px]">
                  {count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
