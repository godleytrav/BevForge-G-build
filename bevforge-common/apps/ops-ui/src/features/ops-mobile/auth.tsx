import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDriverSession, type DriverSessionController } from "@/pages/ops/logistics/use-driver-session";
import { KeyRound, ShieldCheck, UserRoundCheck } from "lucide-react";

const AUTH_SPLASH_DELAY_MS = 950;

const OpsMobileDriverSessionContext =
  createContext<DriverSessionController | null>(null);

export function OpsMobileDriverSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const session = useDriverSession();

  return (
    <OpsMobileDriverSessionContext.Provider value={session}>
      {children}
    </OpsMobileDriverSessionContext.Provider>
  );
}

const useOpsMobileDriverSession = (): DriverSessionController => {
  const context = useContext(OpsMobileDriverSessionContext);
  if (!context) {
    throw new Error(
      "useOpsMobileDriverSession must be used inside OpsMobileDriverSessionProvider.",
    );
  }
  return context;
};

const authBackgroundStyle = {
  background:
    "radial-gradient(circle at top left, rgba(73, 227, 255, 0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(17, 94, 122, 0.22), transparent 40%), linear-gradient(180deg, rgba(4, 12, 18, 1) 0%, rgba(6, 18, 24, 0.98) 46%, rgba(8, 24, 31, 0.98) 100%)",
} as const;

export function OpsMobileAuthGate({ children }: { children: ReactNode }) {
  const driverSession = useOpsMobileDriverSession();
  const [pairingCode, setPairingCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState(driverSession.defaultDeviceLabel);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setDeviceLabel((current) =>
      current.trim().length > 0 ? current : driverSession.defaultDeviceLabel,
    );
  }, [driverSession.defaultDeviceLabel]);

  useEffect(() => {
    if (driverSession.status === "authenticated") {
      setShowLogin(true);
      return;
    }

    setShowLogin(false);
    const timerId = window.setTimeout(() => {
      setShowLogin(true);
    }, AUTH_SPLASH_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [driverSession.status]);

  const welcomeTitle = useMemo(() => "Welcome to OPS Mobile", []);

  const handlePair = async () => {
    const code = pairingCode.trim().toUpperCase();
    const label = deviceLabel.trim();
    if (!code || !label) {
      return;
    }

    await driverSession.pairWithCode(code, label);
    setPairingCode("");
  };

  const handleDevBypass = async () => {
    const label = deviceLabel.trim();
    if (!label) {
      return;
    }
    await driverSession.signInWithDevBypass(label);
  };

  if (driverSession.status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen text-white"
      data-suite="ops"
      style={authBackgroundStyle}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <div className="space-y-6">
          <div
            className={`space-y-4 text-center transition-all duration-500 ${
              showLogin ? "translate-y-0 opacity-100" : "translate-y-4 opacity-95"
            }`}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/12 bg-white/8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur">
              <span className="text-2xl font-semibold tracking-[0.08em] text-cyan-100">
                BF
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/70">
                Powered by BevForge
              </p>
              <h1 className="text-3xl font-semibold text-white">
                {welcomeTitle}
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-6 text-cyan-50/70">
                Pair this device to open delivery routes, scans, and stop
                workflows in the mobile OPS app.
              </p>
            </div>
          </div>

          {driverSession.status === "checking" || !showLogin ? (
            <Card className="rounded-[28px] border-white/12 bg-white/[0.05] shadow-[0_20px_55px_rgba(0,0,0,0.28)] backdrop-blur">
              <CardContent className="space-y-4 p-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Preparing secure driver access
                  </p>
                  <p className="text-sm text-white/60">
                    Loading the mobile sign-in experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {driverSession.status === "unauthenticated" && showLogin ? (
            <Card className="rounded-[28px] border-white/12 bg-white/[0.06] shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
                    <ShieldCheck className="h-4 w-4 text-cyan-100" />
                    Driver access
                  </p>
                  <p className="text-sm leading-6 text-white/68">
                    Driver pairing is the temporary sign-in for OPS Mobile.
                    BevForge account login and role-based access can plug into
                    this same screen later.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ops-mobile-auth-pairing-code"
                    className="text-white/78"
                  >
                    Pairing code
                  </Label>
                  <Input
                    id="ops-mobile-auth-pairing-code"
                    value={pairingCode}
                    onChange={(event) =>
                      setPairingCode(event.target.value.toUpperCase())
                    }
                    placeholder="AB12CD34"
                    autoComplete="one-time-code"
                    className="h-12 rounded-2xl border-white/10 bg-white text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ops-mobile-auth-device-label"
                    className="text-white/78"
                  >
                    Device label
                  </Label>
                  <Input
                    id="ops-mobile-auth-device-label"
                    value={deviceLabel}
                    onChange={(event) => setDeviceLabel(event.target.value)}
                    placeholder="iPhone Driver"
                    autoComplete="off"
                    className="h-12 rounded-2xl border-white/10 bg-white text-slate-950 placeholder:text-slate-500"
                  />
                </div>

                {driverSession.error ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                    {driverSession.error}
                  </div>
                ) : null}

                <Button
                  className="h-12 w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                  onClick={() => {
                    void handlePair();
                  }}
                  disabled={
                    driverSession.pairingPending ||
                    pairingCode.trim().length === 0 ||
                    deviceLabel.trim().length === 0
                  }
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {driverSession.pairingPending
                    ? "Pairing Device..."
                    : "Enter OPS Mobile"}
                </Button>

                {driverSession.canUseDevBypass ? (
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
                    onClick={() => {
                      void handleDevBypass();
                    }}
                    disabled={
                      driverSession.pairingPending || deviceLabel.trim().length === 0
                    }
                  >
                    <UserRoundCheck className="mr-2 h-4 w-4" />
                    {driverSession.pairingPending
                      ? "Opening Dev Session..."
                      : "Enter As Owner (Dev)"}
                  </Button>
                ) : null}

                {driverSession.canUseDevBypass ? (
                  <p className="text-xs leading-5 text-white/55">
                    Dev-only bypass is enabled for this local OPS build. Pairing is still
                    available for real driver enrollment later.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
