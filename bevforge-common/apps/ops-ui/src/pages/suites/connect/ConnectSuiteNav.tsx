import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { connectBadgeStyle, connectMutedPanelStyle } from "./theme";

interface ConnectSuiteNavProps {
  counts?: {
    inbox?: number;
    messages?: number;
    employees?: number;
    tasks?: number;
    campaigns?: number;
    timesheets?: number;
    accounts?: number;
    contacts?: number;
    threads?: number;
  };
}

const navItems: Array<{
  route: string;
  label: string;
  key: keyof NonNullable<ConnectSuiteNavProps["counts"]>;
}> = [
  { route: "/connect/inbox", label: "Inbox", key: "inbox" },
  { route: "/connect/messages", label: "Messages", key: "messages" },
  { route: "/connect/employees", label: "Employees", key: "employees" },
  { route: "/connect/tasks", label: "Tasks", key: "tasks" },
  { route: "/connect/campaigns", label: "Campaigns", key: "campaigns" },
  { route: "/connect/timesheets", label: "Timesheets", key: "timesheets" },
  { route: "/connect/accounts", label: "Accounts", key: "accounts" },
  { route: "/connect/contacts", label: "Contacts", key: "contacts" },
  { route: "/connect/threads", label: "Threads", key: "threads" },
];

export function ConnectSuiteNav({ counts }: ConnectSuiteNavProps) {
  const location = useLocation();

  return (
    <div className="rounded-xl p-3" style={connectMutedPanelStyle}>
      <nav className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.route ||
            (item.route === "/connect/inbox" &&
              location.pathname === "/connect");
          const count = counts?.[item.key];

          return (
            <Link
              key={item.route}
              to={item.route}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-violet-300/70 bg-violet-500/20 text-violet-50 shadow-[0_0_14px_rgba(139,92,246,0.35)]"
                  : "border-violet-400/30 bg-black/20 text-violet-100 hover:border-violet-300/60 hover:bg-violet-500/15"
              }`}
            >
              <span>{item.label}</span>
              {typeof count === "number" && (
                <Badge style={connectBadgeStyle} className="text-[10px]">
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
