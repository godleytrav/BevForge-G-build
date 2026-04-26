# lab-ui

Minimal LAB suite app for recipe export adaptation.

## Routes
- `/lab`
- `/lab/builder`
- `/lab/library`
- `/lab/exports`

## Run (hot reload)
```bash
pnpm --filter lab-ui dev -- --port 5175
```

## OS import handoff
Set OS base URL (optional):
```bash
VITE_OS_API_BASE=http://localhost:5181 pnpm --filter lab-ui dev -- --port 5175
```

`/lab/exports` can send `BevForge.json` to:
- `POST {VITE_OS_API_BASE}/api/os/recipes/import`
