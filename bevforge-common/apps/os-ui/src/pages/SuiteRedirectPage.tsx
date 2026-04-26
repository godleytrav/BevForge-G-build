import { useEffect, useMemo } from 'react';
import { suiteRouteUrl } from '@/lib/suite-links';

type SuiteKey = 'ops' | 'lab' | 'flow' | 'connect';

interface SuiteRedirectPageProps {
  suite: SuiteKey;
}

const suiteMeta: Record<
  SuiteKey,
  { label: string; path: string }
> = {
  ops: {
    label: 'OPS',
    path: '/ops',
  },
  lab: {
    label: 'LAB',
    path: '/lab',
  },
  flow: {
    label: 'FLOW',
    path: '/flow',
  },
  connect: {
    label: 'CONNECT',
    path: '/connect',
  },
};

export default function SuiteRedirectPage({ suite }: SuiteRedirectPageProps) {
  const meta = suiteMeta[suite];

  const targetUrl = useMemo(
    () => suiteRouteUrl(suite, meta.path),
    [meta.path, suite]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.href === targetUrl) return;
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-3">
        <h1 className="text-2xl font-semibold">Opening {meta.label} Suite</h1>
        <p className="text-muted-foreground">
          Redirecting to <span className="font-mono">{targetUrl}</span>
        </p>
        <a
          href={targetUrl}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/10"
        >
          Open {meta.label} now
        </a>
      </div>
    </div>
  );
}
