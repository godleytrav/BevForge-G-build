# BevForge OS/OPS Integration

## Setup

```bash
pnpm install
```

## Running the apps

```bash
pnpm --filter ./apps/os-ui dev
pnpm --filter ./apps/ops-ui dev
```

## Environment variables

Create `apps/ops-ui/.env` (or export in your shell) with:

```
OS_BASE_URL=http://localhost:8080
```

Optional for OS UI proxy mode:

```
OS_BASE_URL=http://localhost:8080
```
