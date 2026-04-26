import { Outlet } from "react-router-dom";
import {
  OpsMobileAuthGate,
  OpsMobileDriverSessionProvider,
} from "@/features/ops-mobile/auth";
import { OpsMobileProvider } from "@/features/ops-mobile/provider";
import { OpsMobileShell } from "@/features/ops-mobile/shell";

export default function OpsMobileLayout() {
  return (
    <OpsMobileDriverSessionProvider>
      <OpsMobileProvider>
        <OpsMobileAuthGate>
          <OpsMobileShell>
            <Outlet />
          </OpsMobileShell>
        </OpsMobileAuthGate>
      </OpsMobileProvider>
    </OpsMobileDriverSessionProvider>
  );
}
