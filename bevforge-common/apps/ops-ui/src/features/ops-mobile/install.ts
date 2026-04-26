import { useCallback, useEffect, useMemo, useState } from "react";

type DeferredInstallPromptEvent = globalThis.Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isIosUserAgent = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || "";
  return /iPad|iPhone|iPod/.test(ua);
};

const isStandaloneDisplay = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    ("standalone" in window.navigator &&
      Boolean(
        (window.navigator as globalThis.Navigator & { standalone?: boolean }).standalone,
      ))
  );
};

export function useOpsMobileInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<
    "idle" | "installing" | "installed" | "dismissed"
  >("idle");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: globalThis.Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setInstallState("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    setInstallState("installing");
    await deferredPrompt.prompt();
    const outcome = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallState(outcome.outcome === "accepted" ? "installed" : "dismissed");
    return outcome.outcome === "accepted";
  }, [deferredPrompt]);

  const state = useMemo(() => {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    const secureContext =
      typeof window !== "undefined" ? window.isSecureContext : false;
    const standalone = isStandaloneDisplay();
    const ios = isIosUserAgent();
    const canPromptInstall = Boolean(deferredPrompt);
    const canUseOfflineShell = secureContext || isLocalhost;

    return {
      secureContext,
      standalone,
      ios,
      canPromptInstall,
      canUseOfflineShell,
      installState,
      needsIosInstructions:
        ios && !standalone && !canPromptInstall,
      needsSecureHostWarning: !canUseOfflineShell,
      installLabel: standalone
        ? "Installed"
        : canPromptInstall
          ? "Install OPS Mobile"
          : ios
            ? "Add To Home Screen"
            : "Install Unavailable",
    };
  }, [deferredPrompt, installState]);

  return {
    ...state,
    install,
  };
}
