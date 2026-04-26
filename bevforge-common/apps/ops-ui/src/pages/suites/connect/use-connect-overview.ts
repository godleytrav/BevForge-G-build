import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchConnectOverview,
  type ConnectOpsAccount,
  type ConnectOverview,
} from "./data";

interface UseConnectOverviewState {
  overview: ConnectOverview | null;
  opsAccounts: ConnectOpsAccount[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setOverview: Dispatch<SetStateAction<ConnectOverview | null>>;
}

const deriveOpsAccountsFromOverview = (
  overview: ConnectOverview,
): ConnectOpsAccount[] => {
  const accountMap = new Map<string, ConnectOpsAccount>();

  const upsertAccount = (
    opsAccountId: string | undefined,
    updatedAt: string,
  ) => {
    if (!opsAccountId) {
      return;
    }

    const normalizedUpdatedAt = new Date(updatedAt).toISOString();
    const existing = accountMap.get(opsAccountId);

    if (!existing) {
      const fallbackAccount: ConnectOpsAccount = {
        id: opsAccountId,
        name: opsAccountId,
        status: "active",
        type: "retail",
        createdAt: normalizedUpdatedAt,
        updatedAt: normalizedUpdatedAt,
      };
      accountMap.set(opsAccountId, fallbackAccount);
      return;
    }

    if (
      new Date(normalizedUpdatedAt).valueOf() >
      new Date(existing.updatedAt).valueOf()
    ) {
      existing.updatedAt = normalizedUpdatedAt;
    }
  };

  overview.contacts.forEach((contact) => {
    upsertAccount(contact.opsAccountId, contact.updatedAt);
  });

  overview.tasks.forEach((task) => {
    upsertAccount(task.opsAccountId, task.updatedAt);
  });

  overview.threads.forEach((thread) => {
    upsertAccount(thread.opsAccountId, thread.updatedAt);
  });

  return Array.from(accountMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const useConnectOverview = (): UseConnectOverviewState => {
  const [overview, setOverview] = useState<ConnectOverview | null>(null);
  const [opsAccounts, setOpsAccounts] = useState<ConnectOpsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const snapshot = await fetchConnectOverview();
      const accounts =
        snapshot.opsAccounts.length > 0
          ? snapshot.opsAccounts
          : deriveOpsAccountsFromOverview(snapshot);
      setOverview(snapshot);
      setOpsAccounts(accounts);
    } catch (loadError) {
      console.error("Failed to load CONNECT overview:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load CONNECT overview",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    overview,
    opsAccounts,
    loading,
    error,
    refresh,
    setOverview,
  };
};
