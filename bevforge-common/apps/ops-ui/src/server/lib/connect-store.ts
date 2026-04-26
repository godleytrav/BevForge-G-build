import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const STORE_SCHEMA_VERSION = "0.2.0";
const RECORD_SCHEMA_VERSION = "1.0.0";

export type ConnectSourceSuite = "os" | "ops" | "lab" | "flow" | "connect";

export type ConnectEventEntityType =
  | "order"
  | "order_line"
  | "reservation"
  | "batch"
  | "recipe_run"
  | "inventory_item"
  | "delivery"
  | "task"
  | "thread"
  | "site"
  | "customer_account"
  | "contact";

export interface ConnectOpsRefs {
  opsAccountId?: string;
  orderId?: string;
  deliveryId?: string;
  siteId?: string;
}

export interface ConnectEventLink {
  schemaVersion: string;
  id: string;
  sourceSuite: ConnectSourceSuite;
  entityType: ConnectEventEntityType;
  entityId: string;
  siteId?: string;
  skuId?: string;
  batchId?: string;
  orderId?: string;
  reservationId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ConnectEmployee {
  schemaVersion: string;
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive" | "on_leave";
  roles: Array<
    | "admin"
    | "operator"
    | "warehouse"
    | "driver"
    | "sales"
    | "customer_success"
    | "finance"
    | "compliance"
  >;
  homeSiteId: string;
  assignedSiteIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectOpsAccount {
  schemaVersion: string;
  id: string;
  name: string;
  status: "prospect" | "active" | "inactive" | "suspended";
  type: "retail" | "bar" | "restaurant" | "distributor" | "internal";
  primarySiteId?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectContactChannel {
  type: "email" | "phone" | "sms" | "whatsapp" | "slack" | "other";
  value: string;
  isPrimary?: boolean;
}

export interface ConnectContact extends ConnectOpsRefs {
  schemaVersion: string;
  id: string;
  opsAccountId: string;
  name: string;
  title?: string;
  status: "active" | "inactive";
  channels: ConnectContactChannel[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectTask extends ConnectOpsRefs {
  schemaVersion: string;
  id: string;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "blocked" | "done" | "canceled";
  priority: "low" | "normal" | "high" | "critical";
  taskType?:
    | "communication"
    | "delivery_followup"
    | "inventory_check"
    | "quality_hold"
    | "customer_service"
    | "compliance"
    | "manual_override_review"
    | "other";
  assigneeIds?: string[];
  dueAt?: string;
  createdById: string;
  links?: ConnectEventLink[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface ConnectThreadParticipant {
  actorType: "employee" | "contact" | "system";
  actorId: string;
  displayName: string;
}

export interface ConnectThreadMessage {
  id: string;
  authorId: string;
  authorType: "employee" | "contact" | "system";
  body: string;
  createdAt: string;
}

export interface ConnectThread extends ConnectOpsRefs {
  schemaVersion: string;
  id: string;
  subject: string;
  status: "open" | "waiting_external" | "resolved" | "closed";
  channel: "internal" | "email" | "sms" | "phone" | "chat" | "other";
  participants: ConnectThreadParticipant[];
  messages: ConnectThreadMessage[];
  links?: ConnectEventLink[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectActivity extends ConnectOpsRefs {
  schemaVersion: string;
  id: string;
  type:
    | "contact_created"
    | "task_created"
    | "task_status_changed"
    | "thread_created"
    | "thread_status_changed"
    | "thread_message_added";
  entityType: "contact" | "task" | "thread";
  entityId: string;
  actorId?: string;
  actorType: "employee" | "contact" | "system";
  message: string;
  createdAt: string;
}

interface ConnectEmployeesState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  employees: ConnectEmployee[];
}

interface ConnectContactsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  contacts: ConnectContact[];
}

interface ConnectOpsAccountsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  accounts: ConnectOpsAccount[];
}

interface ConnectTasksState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  tasks: ConnectTask[];
}

interface ConnectThreadsState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  threads: ConnectThread[];
}

interface ConnectEventLinksState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  links: ConnectEventLink[];
}

interface ConnectActivitiesState {
  schemaVersion: string;
  id: string;
  updatedAt: string;
  activities: ConnectActivity[];
}

export interface ConnectSnapshot {
  employees: ConnectEmployee[];
  opsAccounts: ConnectOpsAccount[];
  contacts: ConnectContact[];
  tasks: ConnectTask[];
  threads: ConnectThread[];
  links: ConnectEventLink[];
  activities: ConnectActivity[];
  updatedAt: string;
}

export interface ImportOpsCrmAccountInput {
  id: string;
  name: string;
  status?: ConnectOpsAccount["status"];
  type?: ConnectOpsAccount["type"];
  primarySiteId?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportOpsCrmContactInput extends ConnectOpsRefs {
  id: string;
  opsAccountId: string;
  name: string;
  title?: string;
  status?: ConnectContact["status"];
  channels: ConnectContactChannel[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportConnectOpsCrmSnapshotInput {
  accounts: ImportOpsCrmAccountInput[];
  contacts: ImportOpsCrmContactInput[];
  sourceLabel?: string;
}

export interface ImportConnectOpsCrmSnapshotResult {
  accountsImported: number;
  contactsImported: number;
  importedAt: string;
}

export interface CreateConnectEmployeeInput {
  id?: string;
  displayName: string;
  email?: string;
  phone?: string;
  status?: ConnectEmployee["status"];
  roles: ConnectEmployee["roles"];
  homeSiteId: string;
  assignedSiteIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateConnectEmployeeInput {
  displayName?: string;
  email?: string;
  phone?: string;
  status?: ConnectEmployee["status"];
  roles?: ConnectEmployee["roles"];
  homeSiteId?: string;
  assignedSiteIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateConnectContactInput extends ConnectOpsRefs {
  id?: string;
  opsAccountId: string;
  name: string;
  title?: string;
  status?: ConnectContact["status"];
  channels: ConnectContactChannel[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  actorId?: string;
  actorType?: ConnectActivity["actorType"];
}

export interface CreateConnectTaskInput extends ConnectOpsRefs {
  id?: string;
  title: string;
  description?: string;
  status?: ConnectTask["status"];
  priority?: ConnectTask["priority"];
  taskType?: ConnectTask["taskType"];
  assigneeIds?: string[];
  dueAt?: string;
  createdById: string;
  links?: ConnectEventLinkInput[];
  metadata?: Record<string, unknown>;
}

export interface ConnectEventLinkInput {
  id?: string;
  sourceSuite: ConnectSourceSuite;
  entityType: ConnectEventEntityType;
  entityId: string;
  siteId?: string;
  skuId?: string;
  batchId?: string;
  orderId?: string;
  reservationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateConnectThreadInput extends ConnectOpsRefs {
  id?: string;
  subject: string;
  status?: ConnectThread["status"];
  channel?: ConnectThread["channel"];
  participants: ConnectThreadParticipant[];
  initialMessage?: {
    authorId: string;
    authorType: ConnectThreadMessage["authorType"];
    body: string;
  };
  links?: ConnectEventLinkInput[];
}

export interface AppendConnectThreadMessageInput {
  authorId: string;
  authorType: ConnectThreadMessage["authorType"];
  body: string;
}

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "apps", "ops-ui"))) {
    return cwd;
  }
  if (cwd.endsWith(path.join("apps", "ops-ui"))) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const connectRoot = path.join(repoRoot, "commissioning", "connect");

const connectPaths = {
  root: connectRoot,
  employeesFile: path.join(connectRoot, "employees.json"),
  opsAccountsFile: path.join(connectRoot, "accounts.json"),
  contactsFile: path.join(connectRoot, "contacts.json"),
  tasksFile: path.join(connectRoot, "tasks.json"),
  threadsFile: path.join(connectRoot, "threads.json"),
  linksFile: path.join(connectRoot, "event-links.json"),
  activitiesFile: path.join(connectRoot, "activities.json"),
};

const CONTACT_STATUSES = new Set<ConnectContact["status"]>([
  "active",
  "inactive",
]);
const EMPLOYEE_STATUSES = new Set<ConnectEmployee["status"]>([
  "active",
  "inactive",
  "on_leave",
]);
const EMPLOYEE_ROLES = new Set<ConnectEmployee["roles"][number]>([
  "admin",
  "operator",
  "warehouse",
  "driver",
  "sales",
  "customer_success",
  "finance",
  "compliance",
]);
const OPS_ACCOUNT_STATUSES = new Set<ConnectOpsAccount["status"]>([
  "prospect",
  "active",
  "inactive",
  "suspended",
]);
const OPS_ACCOUNT_TYPES = new Set<ConnectOpsAccount["type"]>([
  "retail",
  "bar",
  "restaurant",
  "distributor",
  "internal",
]);
const CHANNEL_TYPES = new Set<ConnectContactChannel["type"]>([
  "email",
  "phone",
  "sms",
  "whatsapp",
  "slack",
  "other",
]);
const TASK_STATUSES = new Set<ConnectTask["status"]>([
  "open",
  "in_progress",
  "blocked",
  "done",
  "canceled",
]);
const TASK_PRIORITIES = new Set<ConnectTask["priority"]>([
  "low",
  "normal",
  "high",
  "critical",
]);
const TASK_TYPES = new Set<Exclude<ConnectTask["taskType"], undefined>>([
  "communication",
  "delivery_followup",
  "inventory_check",
  "quality_hold",
  "customer_service",
  "compliance",
  "manual_override_review",
  "other",
]);
const THREAD_STATUSES = new Set<ConnectThread["status"]>([
  "open",
  "waiting_external",
  "resolved",
  "closed",
]);
const THREAD_CHANNELS = new Set<ConnectThread["channel"]>([
  "internal",
  "email",
  "sms",
  "phone",
  "chat",
  "other",
]);
const THREAD_ACTOR_TYPES = new Set<ConnectThreadParticipant["actorType"]>([
  "employee",
  "contact",
  "system",
]);
const SOURCE_SUITES = new Set<ConnectSourceSuite>([
  "os",
  "ops",
  "lab",
  "flow",
  "connect",
]);
const EVENT_ENTITY_TYPES = new Set<ConnectEventEntityType>([
  "order",
  "order_line",
  "reservation",
  "batch",
  "recipe_run",
  "inventory_item",
  "delivery",
  "task",
  "thread",
  "site",
  "customer_account",
  "contact",
]);

const nowIso = () => new Date().toISOString();

const ensureDirectory = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const readJsonOrDefault = async <T>(
  filePath: string,
  fallback: T,
): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (filePath: string, data: unknown) => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const ensureFile = async <T>(
  filePath: string,
  initialData: T,
): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await writeJson(filePath, initialData);
  }
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toRequiredString = (value: unknown, fieldName: string): string => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .map((entry) => toOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
  return normalized.length > 0 ? normalized : undefined;
};

const toMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const toIsoDateTimeOptional = (
  value: unknown,
  fieldName: string,
): string | undefined => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed.toISOString();
};

const toStatus = <T extends string>(
  value: unknown,
  allowed: Set<T>,
  fallback: T,
  fieldName: string,
): T => {
  if (typeof value === "string" && allowed.has(value as T)) {
    return value as T;
  }
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  throw new Error(`Invalid ${fieldName}`);
};

const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const sanitizeOpsRefs = (input: ConnectOpsRefs): ConnectOpsRefs => {
  const refs: ConnectOpsRefs = {};
  const row = input as Record<string, unknown>;
  const opsAccountId =
    toOptionalString(input.opsAccountId) ?? toOptionalString(row.accountId);
  if (opsAccountId) {
    refs.opsAccountId = opsAccountId;
  }

  const orderId = toOptionalString(input.orderId);
  if (orderId) {
    refs.orderId = orderId;
  }

  const deliveryId = toOptionalString(input.deliveryId);
  if (deliveryId) {
    refs.deliveryId = deliveryId;
  }

  const siteId = toOptionalString(input.siteId);
  if (siteId) {
    refs.siteId = siteId;
  }

  return refs;
};

const defaultEmployeesState = (): ConnectEmployeesState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-employees",
  updatedAt: nowIso(),
  employees: [],
});

const defaultContactsState = (): ConnectContactsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-contacts",
  updatedAt: nowIso(),
  contacts: [],
});

const defaultOpsAccountsState = (): ConnectOpsAccountsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-ops-accounts-mirror",
  updatedAt: nowIso(),
  accounts: [],
});

const defaultTasksState = (): ConnectTasksState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-tasks",
  updatedAt: nowIso(),
  tasks: [],
});

const defaultThreadsState = (): ConnectThreadsState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-threads",
  updatedAt: nowIso(),
  threads: [],
});

const defaultLinksState = (): ConnectEventLinksState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-event-links",
  updatedAt: nowIso(),
  links: [],
});

const defaultActivitiesState = (): ConnectActivitiesState => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  id: "connect-activities",
  updatedAt: nowIso(),
  activities: [],
});

export const ensureConnectStore = async (): Promise<void> => {
  await ensureDirectory(connectPaths.root);
  await Promise.all([
    ensureFile(connectPaths.employeesFile, defaultEmployeesState()),
    ensureFile(connectPaths.opsAccountsFile, defaultOpsAccountsState()),
    ensureFile(connectPaths.contactsFile, defaultContactsState()),
    ensureFile(connectPaths.tasksFile, defaultTasksState()),
    ensureFile(connectPaths.threadsFile, defaultThreadsState()),
    ensureFile(connectPaths.linksFile, defaultLinksState()),
    ensureFile(connectPaths.activitiesFile, defaultActivitiesState()),
  ]);
};

const readEmployeesState = async (): Promise<ConnectEmployeesState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectEmployeesState>(
    connectPaths.employeesFile,
    defaultEmployeesState(),
  );
  return {
    ...defaultEmployeesState(),
    ...state,
    employees: Array.isArray(state.employees) ? state.employees : [],
  };
};

const readContactsState = async (): Promise<ConnectContactsState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectContactsState>(
    connectPaths.contactsFile,
    defaultContactsState(),
  );
  return {
    ...defaultContactsState(),
    ...state,
    contacts: Array.isArray(state.contacts) ? state.contacts : [],
  };
};

const readOpsAccountsState = async (): Promise<ConnectOpsAccountsState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectOpsAccountsState>(
    connectPaths.opsAccountsFile,
    defaultOpsAccountsState(),
  );
  return {
    ...defaultOpsAccountsState(),
    ...state,
    accounts: Array.isArray(state.accounts) ? state.accounts : [],
  };
};

const readTasksState = async (): Promise<ConnectTasksState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectTasksState>(
    connectPaths.tasksFile,
    defaultTasksState(),
  );
  return {
    ...defaultTasksState(),
    ...state,
    tasks: Array.isArray(state.tasks) ? state.tasks : [],
  };
};

const readThreadsState = async (): Promise<ConnectThreadsState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectThreadsState>(
    connectPaths.threadsFile,
    defaultThreadsState(),
  );
  return {
    ...defaultThreadsState(),
    ...state,
    threads: Array.isArray(state.threads) ? state.threads : [],
  };
};

const readLinksState = async (): Promise<ConnectEventLinksState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectEventLinksState>(
    connectPaths.linksFile,
    defaultLinksState(),
  );
  return {
    ...defaultLinksState(),
    ...state,
    links: Array.isArray(state.links) ? state.links : [],
  };
};

const readActivitiesState = async (): Promise<ConnectActivitiesState> => {
  await ensureConnectStore();
  const state = await readJsonOrDefault<ConnectActivitiesState>(
    connectPaths.activitiesFile,
    defaultActivitiesState(),
  );
  return {
    ...defaultActivitiesState(),
    ...state,
    activities: Array.isArray(state.activities) ? state.activities : [],
  };
};

const writeEmployeesState = async (
  state: ConnectEmployeesState,
): Promise<void> => {
  await writeJson(connectPaths.employeesFile, state);
};

const writeContactsState = async (
  state: ConnectContactsState,
): Promise<void> => {
  await writeJson(connectPaths.contactsFile, state);
};

const writeOpsAccountsState = async (
  state: ConnectOpsAccountsState,
): Promise<void> => {
  await writeJson(connectPaths.opsAccountsFile, state);
};

const writeTasksState = async (state: ConnectTasksState): Promise<void> => {
  await writeJson(connectPaths.tasksFile, state);
};

const writeThreadsState = async (state: ConnectThreadsState): Promise<void> => {
  await writeJson(connectPaths.threadsFile, state);
};

const writeLinksState = async (
  state: ConnectEventLinksState,
): Promise<void> => {
  await writeJson(connectPaths.linksFile, state);
};

const writeActivitiesState = async (
  state: ConnectActivitiesState,
): Promise<void> => {
  await writeJson(connectPaths.activitiesFile, state);
};

const sanitizeContactChannels = (value: unknown): ConnectContactChannel[] => {
  if (!Array.isArray(value)) {
    throw new Error("channels is required");
  }

  const channels: ConnectContactChannel[] = [];

  for (const channel of value) {
    if (!channel || typeof channel !== "object" || Array.isArray(channel)) {
      continue;
    }

    const row = channel as Record<string, unknown>;
    const type = toStatus(row.type, CHANNEL_TYPES, "email", "channel type");
    const channelValue = toOptionalString(row.value);

    if (!channelValue) {
      continue;
    }

    const normalized: ConnectContactChannel = {
      type,
      value: channelValue,
    };

    if (typeof row.isPrimary === "boolean") {
      normalized.isPrimary = row.isPrimary;
    }

    channels.push(normalized);
  }

  if (channels.length === 0) {
    throw new Error("channels must include at least one channel");
  }

  return channels;
};

const sanitizeEmployeeRoles = (
  value: unknown,
): ConnectEmployee["roles"] => {
  const normalized = toStringArray(value) ?? [];
  const roles = normalized
    .filter(
      (entry): entry is ConnectEmployee["roles"][number] =>
        EMPLOYEE_ROLES.has(entry as ConnectEmployee["roles"][number]),
    )
    .filter(
      (entry, index, array) => array.findIndex((item) => item === entry) === index,
    );

  return roles.length > 0 ? roles : ["operator"];
};

const normalizeOpsImportMetadata = (
  metadata: Record<string, unknown> | undefined,
  sourceLabel: string,
  importedAt: string,
): Record<string, unknown> => ({
  ...(metadata ?? {}),
  sourceSuite: "ops",
  importMode: "mirror",
  sourceLabel,
  importedAt,
});

const sanitizeImportedOpsAccount = (
  input: ImportOpsCrmAccountInput,
  sourceLabel: string,
  importedAt: string,
): ConnectOpsAccount => {
  const id = toRequiredString(input.id, "account.id");
  const name = toRequiredString(input.name, "account.name");
  const now = nowIso();

  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id,
    name,
    status: toStatus(
      input.status,
      OPS_ACCOUNT_STATUSES,
      "active",
      "account.status",
    ),
    type: toStatus(input.type, OPS_ACCOUNT_TYPES, "retail", "account.type"),
    primarySiteId: toOptionalString(input.primarySiteId),
    email: toOptionalString(input.email),
    phone: toOptionalString(input.phone),
    address: toOptionalString(input.address),
    metadata: normalizeOpsImportMetadata(
      toMetadata(input.metadata),
      sourceLabel,
      importedAt,
    ),
    createdAt:
      toIsoDateTimeOptional(input.createdAt, "account.createdAt") ?? now,
    updatedAt:
      toIsoDateTimeOptional(input.updatedAt, "account.updatedAt") ?? now,
  };
};

const sanitizeImportedOpsContact = (
  input: ImportOpsCrmContactInput,
  sourceLabel: string,
  importedAt: string,
): ConnectContact => {
  const id = toRequiredString(input.id, "contact.id");
  const opsAccountId = toRequiredString(
    input.opsAccountId,
    "contact.opsAccountId",
  );
  const name = toRequiredString(input.name, "contact.name");
  const channels = sanitizeContactChannels(input.channels);
  const now = nowIso();
  const refs = sanitizeOpsRefs(input);

  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id,
    opsAccountId,
    name,
    title: toOptionalString(input.title),
    status: toStatus(
      input.status,
      CONTACT_STATUSES,
      "active",
      "contact.status",
    ),
    channels,
    tags: toStringArray(input.tags),
    metadata: normalizeOpsImportMetadata(
      toMetadata(input.metadata),
      sourceLabel,
      importedAt,
    ),
    createdAt:
      toIsoDateTimeOptional(input.createdAt, "contact.createdAt") ?? now,
    updatedAt:
      toIsoDateTimeOptional(input.updatedAt, "contact.updatedAt") ?? now,
    ...refs,
  };
};

const sanitizeThreadParticipants = (
  value: unknown,
): ConnectThreadParticipant[] => {
  if (!Array.isArray(value)) {
    throw new Error("participants is required");
  }

  const participants = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const actorType = toStatus(
        row.actorType,
        THREAD_ACTOR_TYPES,
        "employee",
        "participant actorType",
      );
      const actorId = toOptionalString(row.actorId);
      const displayName = toOptionalString(row.displayName);
      if (!actorId || !displayName) {
        return null;
      }
      return {
        actorType,
        actorId,
        displayName,
      } satisfies ConnectThreadParticipant;
    })
    .filter((entry): entry is ConnectThreadParticipant => entry !== null);

  if (participants.length === 0) {
    throw new Error("participants must include at least one actor");
  }

  return participants;
};

const sanitizeEventLink = (value: ConnectEventLinkInput): ConnectEventLink => {
  const sourceSuite = toStatus(
    value.sourceSuite,
    SOURCE_SUITES,
    "connect",
    "sourceSuite",
  );
  const entityType = toStatus(
    value.entityType,
    EVENT_ENTITY_TYPES,
    "task",
    "entityType",
  );
  const entityId = toRequiredString(value.entityId, "entityId");

  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(value.id) ?? createId("link"),
    sourceSuite,
    entityType,
    entityId,
    siteId: toOptionalString(value.siteId),
    skuId: toOptionalString(value.skuId),
    batchId: toOptionalString(value.batchId),
    orderId: toOptionalString(value.orderId),
    reservationId: toOptionalString(value.reservationId),
    metadata: toMetadata(value.metadata),
    createdAt: nowIso(),
  };
};

const sanitizeEventLinks = (value: unknown): ConnectEventLink[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .filter(
      (entry): entry is ConnectEventLinkInput =>
        Boolean(entry) && typeof entry === "object",
    )
    .map((entry) => sanitizeEventLink(entry));

  return links.length > 0 ? links : undefined;
};

const sortByUpdatedAtDesc = <T extends { updatedAt?: string }>(
  rows: T[],
): T[] =>
  [...rows].sort((a, b) => {
    const left = a.updatedAt ? new Date(a.updatedAt).valueOf() : 0;
    const right = b.updatedAt ? new Date(b.updatedAt).valueOf() : 0;
    return right - left;
  });

const sortByCreatedAtDesc = <T extends { createdAt?: string }>(
  rows: T[],
): T[] =>
  [...rows].sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
    const right = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
    return right - left;
  });

const eventLinkKey = (link: ConnectEventLink): string =>
  [
    link.sourceSuite,
    link.entityType,
    link.entityId,
    link.siteId ?? "",
    link.orderId ?? "",
    link.batchId ?? "",
    link.reservationId ?? "",
    link.skuId ?? "",
  ].join("|");

const appendGlobalEventLinks = async (
  links: ConnectEventLink[] | undefined,
): Promise<void> => {
  if (!links || links.length === 0) {
    return;
  }

  const state = await readLinksState();
  const keyToLink = new Map<string, ConnectEventLink>();

  for (const existing of state.links) {
    keyToLink.set(eventLinkKey(existing), existing);
  }
  for (const link of links) {
    keyToLink.set(eventLinkKey(link), link);
  }

  const merged = sortByCreatedAtDesc(Array.from(keyToLink.values()));
  await writeLinksState({
    ...state,
    updatedAt: nowIso(),
    links: merged,
  });
};

const appendActivity = async (
  input: Omit<ConnectActivity, "schemaVersion" | "id" | "createdAt">,
): Promise<ConnectActivity> => {
  const state = await readActivitiesState();
  const now = nowIso();

  const activity: ConnectActivity = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: createId("activity"),
    createdAt: now,
    ...sanitizeOpsRefs(input),
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: toOptionalString(input.actorId),
    actorType: input.actorType,
    message: input.message,
  };

  const nextActivities = sortByCreatedAtDesc([
    activity,
    ...state.activities,
  ]).slice(0, 500);

  await writeActivitiesState({
    ...state,
    updatedAt: now,
    activities: nextActivities,
  });

  return activity;
};

export const readConnectSnapshot = async (): Promise<ConnectSnapshot> => {
  const [
    employeesState,
    opsAccountsState,
    contactsState,
    tasksState,
    threadsState,
    linksState,
    activitiesState,
  ] = await Promise.all([
    readEmployeesState(),
    readOpsAccountsState(),
    readContactsState(),
    readTasksState(),
    readThreadsState(),
    readLinksState(),
    readActivitiesState(),
  ]);

  const updatedAt =
    [
      employeesState.updatedAt,
      opsAccountsState.updatedAt,
      contactsState.updatedAt,
      tasksState.updatedAt,
      threadsState.updatedAt,
      linksState.updatedAt,
      activitiesState.updatedAt,
    ].sort((a, b) => new Date(b).valueOf() - new Date(a).valueOf())[0] ??
    nowIso();

  return {
    employees: sortByUpdatedAtDesc(employeesState.employees),
    opsAccounts: sortByUpdatedAtDesc(opsAccountsState.accounts),
    contacts: sortByUpdatedAtDesc(contactsState.contacts),
    tasks: sortByUpdatedAtDesc(tasksState.tasks),
    threads: sortByUpdatedAtDesc(threadsState.threads),
    links: sortByCreatedAtDesc(linksState.links),
    activities: sortByCreatedAtDesc(activitiesState.activities),
    updatedAt,
  };
};

export const importConnectOpsCrmSnapshot = async (
  input: ImportConnectOpsCrmSnapshotInput,
): Promise<ImportConnectOpsCrmSnapshotResult> => {
  if (!input || typeof input !== "object") {
    throw new Error("Import payload is required");
  }

  if (!Array.isArray(input.accounts) || !Array.isArray(input.contacts)) {
    throw new Error("Import payload must include accounts and contacts arrays");
  }

  const importedAt = nowIso();
  const sourceLabel =
    toOptionalString(input.sourceLabel) ?? "ops-crm-mirror-import";

  const accountMap = new Map<string, ConnectOpsAccount>();
  for (const row of input.accounts) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const normalized = sanitizeImportedOpsAccount(row, sourceLabel, importedAt);
    accountMap.set(normalized.id, normalized);
  }

  const contactMap = new Map<string, ConnectContact>();
  for (const row of input.contacts) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const normalized = sanitizeImportedOpsContact(row, sourceLabel, importedAt);
    contactMap.set(normalized.id, normalized);
  }

  const accounts = sortByUpdatedAtDesc(Array.from(accountMap.values()));
  const contacts = sortByUpdatedAtDesc(Array.from(contactMap.values()));

  const [opsAccountsState, contactsState] = await Promise.all([
    readOpsAccountsState(),
    readContactsState(),
  ]);

  await Promise.all([
    writeOpsAccountsState({
      ...opsAccountsState,
      updatedAt: importedAt,
      accounts,
    }),
    writeContactsState({
      ...contactsState,
      updatedAt: importedAt,
      contacts,
    }),
  ]);

  return {
    accountsImported: accounts.length,
    contactsImported: contacts.length,
    importedAt,
  };
};

export const listConnectEmployees = async (): Promise<ConnectEmployee[]> => {
  const state = await readEmployeesState();
  return sortByUpdatedAtDesc(state.employees);
};

export const createConnectEmployee = async (
  input: CreateConnectEmployeeInput,
): Promise<ConnectEmployee> => {
  const displayName = toRequiredString(input.displayName, "displayName");
  const homeSiteId = toRequiredString(input.homeSiteId, "homeSiteId");
  const now = nowIso();

  const employee: ConnectEmployee = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("employee"),
    displayName,
    email: toOptionalString(input.email),
    phone: toOptionalString(input.phone),
    status: toStatus(input.status, EMPLOYEE_STATUSES, "active", "status"),
    roles: sanitizeEmployeeRoles(input.roles),
    homeSiteId,
    assignedSiteIds: toStringArray(input.assignedSiteIds),
    metadata: toMetadata(input.metadata),
    createdAt: now,
    updatedAt: now,
  };

  const state = await readEmployeesState();
  const nextEmployees = sortByUpdatedAtDesc([
    employee,
    ...state.employees.filter((existing) => existing.id !== employee.id),
  ]);

  await writeEmployeesState({
    ...state,
    updatedAt: now,
    employees: nextEmployees,
  });

  return employee;
};

export const updateConnectEmployee = async (
  employeeId: string,
  input: UpdateConnectEmployeeInput,
): Promise<ConnectEmployee | null> => {
  const normalizedEmployeeId = toRequiredString(employeeId, "employeeId");
  const state = await readEmployeesState();
  const existing = state.employees.find(
    (employee) => employee.id === normalizedEmployeeId,
  );

  if (!existing) {
    return null;
  }

  const inputRow = input as Record<string, unknown>;
  const displayName = toOptionalString(input.displayName);
  const homeSiteId = toOptionalString(input.homeSiteId);
  const now = nowIso();

  const updated: ConnectEmployee = {
    ...existing,
    displayName: displayName ?? existing.displayName,
    status: toStatus(
      input.status ?? existing.status,
      EMPLOYEE_STATUSES,
      existing.status,
      "status",
    ),
    roles: input.roles ? sanitizeEmployeeRoles(input.roles) : existing.roles,
    homeSiteId: homeSiteId ?? existing.homeSiteId,
    updatedAt: now,
  };

  if ("email" in inputRow) {
    updated.email = toOptionalString(inputRow.email);
  }
  if ("phone" in inputRow) {
    updated.phone = toOptionalString(inputRow.phone);
  }
  if ("assignedSiteIds" in inputRow) {
    updated.assignedSiteIds = toStringArray(inputRow.assignedSiteIds);
  }
  if ("metadata" in inputRow) {
    updated.metadata = toMetadata(inputRow.metadata);
  }

  const nextEmployees = sortByUpdatedAtDesc([
    updated,
    ...state.employees.filter((employee) => employee.id !== normalizedEmployeeId),
  ]);

  await writeEmployeesState({
    ...state,
    updatedAt: now,
    employees: nextEmployees,
  });

  return updated;
};

export const createConnectContact = async (
  input: CreateConnectContactInput,
): Promise<ConnectContact> => {
  const opsAccountId = toRequiredString(input.opsAccountId, "opsAccountId");
  const name = toRequiredString(input.name, "name");
  const channels = sanitizeContactChannels(input.channels);
  const now = nowIso();
  const refs = sanitizeOpsRefs(input);

  const contact: ConnectContact = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("contact"),
    opsAccountId,
    name,
    title: toOptionalString(input.title),
    status: toStatus(input.status, CONTACT_STATUSES, "active", "status"),
    channels,
    tags: toStringArray(input.tags),
    metadata: toMetadata(input.metadata),
    createdAt: now,
    updatedAt: now,
    ...refs,
  };

  const state = await readContactsState();
  const nextContacts = sortByUpdatedAtDesc([
    contact,
    ...state.contacts.filter((existing) => existing.id !== contact.id),
  ]);

  await writeContactsState({
    ...state,
    updatedAt: now,
    contacts: nextContacts,
  });

  await appendActivity({
    type: "contact_created",
    entityType: "contact",
    entityId: contact.id,
    actorId: toOptionalString(input.actorId),
    actorType:
      input.actorType && THREAD_ACTOR_TYPES.has(input.actorType)
        ? input.actorType
        : "employee",
    message: `Contact ${contact.name} created for OPS account ${contact.opsAccountId}`,
    ...refs,
  });

  return contact;
};

export const createConnectTask = async (
  input: CreateConnectTaskInput,
): Promise<ConnectTask> => {
  const title = toRequiredString(input.title, "title");
  const createdById = toRequiredString(input.createdById, "createdById");
  const links = sanitizeEventLinks(input.links);
  const now = nowIso();
  const refs = sanitizeOpsRefs(input);

  const status = toStatus(input.status, TASK_STATUSES, "open", "status");

  const task: ConnectTask = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("task"),
    title,
    description: toOptionalString(input.description),
    status,
    priority: toStatus(input.priority, TASK_PRIORITIES, "normal", "priority"),
    taskType: input.taskType
      ? toStatus(input.taskType, TASK_TYPES, "other", "taskType")
      : undefined,
    assigneeIds: toStringArray(input.assigneeIds),
    dueAt: toIsoDateTimeOptional(input.dueAt, "dueAt"),
    createdById,
    links,
    metadata: toMetadata(input.metadata),
    createdAt: now,
    updatedAt: now,
    closedAt: status === "done" || status === "canceled" ? now : undefined,
    ...refs,
  };

  const state = await readTasksState();
  const nextTasks = sortByUpdatedAtDesc([
    task,
    ...state.tasks.filter((existing) => existing.id !== task.id),
  ]);

  await writeTasksState({
    ...state,
    updatedAt: now,
    tasks: nextTasks,
  });

  await appendGlobalEventLinks(links);

  await appendActivity({
    type: "task_created",
    entityType: "task",
    entityId: task.id,
    actorId: createdById,
    actorType: "employee",
    message: `Task ${task.title} created`,
    ...refs,
  });

  return task;
};

export const updateConnectTaskStatus = async (
  taskId: string,
  nextStatus: ConnectTask["status"],
): Promise<ConnectTask | null> => {
  const normalizedTaskId = toRequiredString(taskId, "taskId");
  const status = toStatus(nextStatus, TASK_STATUSES, "open", "status");

  const state = await readTasksState();
  const existing = state.tasks.find((task) => task.id === normalizedTaskId);

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const updated: ConnectTask = {
    ...existing,
    status,
    updatedAt: now,
    closedAt:
      status === "done" || status === "canceled"
        ? (existing.closedAt ?? now)
        : undefined,
  };

  const nextTasks = sortByUpdatedAtDesc([
    updated,
    ...state.tasks.filter((task) => task.id !== normalizedTaskId),
  ]);

  await writeTasksState({
    ...state,
    updatedAt: now,
    tasks: nextTasks,
  });

  await appendActivity({
    type: "task_status_changed",
    entityType: "task",
    entityId: updated.id,
    actorId: updated.createdById,
    actorType: "employee",
    message: `Task ${updated.title} status changed to ${updated.status}`,
    ...sanitizeOpsRefs(updated),
  });

  return updated;
};

export const createConnectThread = async (
  input: CreateConnectThreadInput,
): Promise<ConnectThread> => {
  const subject = toRequiredString(input.subject, "subject");
  const participants = sanitizeThreadParticipants(input.participants);
  const status = toStatus(input.status, THREAD_STATUSES, "open", "status");
  const channel = toStatus(
    input.channel,
    THREAD_CHANNELS,
    "internal",
    "channel",
  );
  const links = sanitizeEventLinks(input.links);
  const now = nowIso();
  const refs = sanitizeOpsRefs(input);

  const initialMessageBody = toOptionalString(input.initialMessage?.body);
  const initialAuthorId = toOptionalString(input.initialMessage?.authorId);
  const initialAuthorType = input.initialMessage?.authorType
    ? toStatus(
        input.initialMessage.authorType,
        THREAD_ACTOR_TYPES,
        "employee",
        "authorType",
      )
    : undefined;

  const messages: ConnectThreadMessage[] =
    initialMessageBody && initialAuthorId && initialAuthorType
      ? [
          {
            id: createId("msg"),
            authorId: initialAuthorId,
            authorType: initialAuthorType,
            body: initialMessageBody,
            createdAt: now,
          },
        ]
      : [];

  const thread: ConnectThread = {
    schemaVersion: RECORD_SCHEMA_VERSION,
    id: toOptionalString(input.id) ?? createId("thread"),
    subject,
    status,
    channel,
    participants,
    messages,
    links,
    createdAt: now,
    updatedAt: now,
    ...refs,
  };

  const state = await readThreadsState();
  const nextThreads = sortByUpdatedAtDesc([
    thread,
    ...state.threads.filter((existing) => existing.id !== thread.id),
  ]);

  await writeThreadsState({
    ...state,
    updatedAt: now,
    threads: nextThreads,
  });

  await appendGlobalEventLinks(links);

  await appendActivity({
    type: "thread_created",
    entityType: "thread",
    entityId: thread.id,
    actorId: initialAuthorId,
    actorType: initialAuthorType ?? "system",
    message: `Thread ${thread.subject} created`,
    ...refs,
  });

  return thread;
};

export const updateConnectThreadStatus = async (
  threadId: string,
  nextStatus: ConnectThread["status"],
): Promise<ConnectThread | null> => {
  const normalizedThreadId = toRequiredString(threadId, "threadId");
  const status = toStatus(nextStatus, THREAD_STATUSES, "open", "status");

  const state = await readThreadsState();
  const existing = state.threads.find(
    (thread) => thread.id === normalizedThreadId,
  );

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const updated: ConnectThread = {
    ...existing,
    status,
    updatedAt: now,
  };

  const nextThreads = sortByUpdatedAtDesc([
    updated,
    ...state.threads.filter((thread) => thread.id !== normalizedThreadId),
  ]);

  await writeThreadsState({
    ...state,
    updatedAt: now,
    threads: nextThreads,
  });

  await appendActivity({
    type: "thread_status_changed",
    entityType: "thread",
    entityId: updated.id,
    actorType: "employee",
    message: `Thread ${updated.subject} status changed to ${updated.status}`,
    ...sanitizeOpsRefs(updated),
  });

  return updated;
};

export const appendConnectThreadMessage = async (
  threadId: string,
  input: AppendConnectThreadMessageInput,
): Promise<ConnectThread | null> => {
  const normalizedThreadId = toRequiredString(threadId, "threadId");
  const authorId = toRequiredString(input.authorId, "authorId");
  const authorType = toStatus(
    input.authorType,
    THREAD_ACTOR_TYPES,
    "employee",
    "authorType",
  );
  const body = toRequiredString(input.body, "body");

  const state = await readThreadsState();
  const existing = state.threads.find(
    (thread) => thread.id === normalizedThreadId,
  );

  if (!existing) {
    return null;
  }

  const now = nowIso();
  const message: ConnectThreadMessage = {
    id: createId("msg"),
    authorId,
    authorType,
    body,
    createdAt: now,
  };

  const updated: ConnectThread = {
    ...existing,
    messages: [...existing.messages, message],
    updatedAt: now,
  };

  const nextThreads = sortByUpdatedAtDesc([
    updated,
    ...state.threads.filter((thread) => thread.id !== normalizedThreadId),
  ]);

  await writeThreadsState({
    ...state,
    updatedAt: now,
    threads: nextThreads,
  });

  await appendActivity({
    type: "thread_message_added",
    entityType: "thread",
    entityId: updated.id,
    actorId: authorId,
    actorType: authorType,
    message: `Message added to thread ${updated.subject}`,
    ...sanitizeOpsRefs(updated),
  });

  return updated;
};
