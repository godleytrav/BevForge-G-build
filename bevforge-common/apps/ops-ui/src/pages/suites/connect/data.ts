import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  getOpsClientRecords,
  getOpsLeadRecords,
  getOpsProspectRecords,
} from "@/pages/ops/crm/data";

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
  id: string;
  sourceSuite: ConnectSourceSuite;
  entityType: ConnectEventEntityType;
  entityId: string;
  siteId?: string;
  skuId?: string;
  batchId?: string;
  orderId?: string;
  reservationId?: string;
  createdAt: string;
}

export interface ConnectEmployee {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive" | "on_leave";
  roles: string[];
  homeSiteId: string;
  assignedSiteIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectOpsAccount {
  id: string;
  name: string;
  status: "prospect" | "active" | "inactive" | "suspended";
  type: "retail" | "bar" | "restaurant" | "distributor" | "internal";
  primarySiteId?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectContactChannel {
  type: "email" | "phone" | "sms" | "whatsapp" | "slack" | "other";
  value: string;
  isPrimary?: boolean;
}

export interface ConnectContact extends ConnectOpsRefs {
  id: string;
  opsAccountId: string;
  name: string;
  title?: string;
  status: "active" | "inactive";
  channels: ConnectContactChannel[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectTask extends ConnectOpsRefs {
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

export interface ConnectCampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
}

export interface ConnectCampaign {
  id: string;
  name: string;
  status:
    | "draft"
    | "scheduled"
    | "running"
    | "paused"
    | "completed"
    | "canceled";
  channel: "email" | "sms" | "internal";
  audienceLabel: string;
  audienceOpsAccountIds?: string[];
  ownerId: string;
  subject?: string;
  content: string;
  scheduledFor?: string;
  launchedAt?: string;
  completedAt?: string;
  metrics: ConnectCampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectTimesheetEntry {
  id: string;
  employeeId: string;
  siteId?: string;
  status: "open" | "submitted" | "approved" | "rejected";
  clockInAt: string;
  clockOutAt?: string;
  breakMinutes: number;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectOverview {
  employees: ConnectEmployee[];
  opsAccounts: ConnectOpsAccount[];
  contacts: ConnectContact[];
  tasks: ConnectTask[];
  threads: ConnectThread[];
  links: ConnectEventLink[];
  activities: ConnectActivity[];
  updatedAt: string;
  boundaries: {
    os: string;
    ops: string;
  };
}

export interface CreateConnectEmployeePayload {
  displayName: string;
  email?: string;
  phone?: string;
  status?: ConnectEmployee["status"];
  roles: string[];
  homeSiteId: string;
  assignedSiteIds?: string[];
}

export interface UpdateConnectEmployeePayload {
  displayName?: string;
  email?: string;
  phone?: string;
  status?: ConnectEmployee["status"];
  roles?: string[];
  homeSiteId?: string;
  assignedSiteIds?: string[];
}

export interface CreateConnectTaskPayload extends ConnectOpsRefs {
  title: string;
  description?: string;
  status: ConnectTask["status"];
  priority: ConnectTask["priority"];
  taskType?: ConnectTask["taskType"];
  assigneeIds?: string[];
  dueAt?: string;
  createdById: string;
  links?: Array<{
    sourceSuite: ConnectSourceSuite;
    entityType: ConnectEventEntityType;
    entityId: string;
    siteId?: string;
    skuId?: string;
    batchId?: string;
    orderId?: string;
    reservationId?: string;
  }>;
}

export interface CreateConnectThreadPayload extends ConnectOpsRefs {
  subject: string;
  status: ConnectThread["status"];
  channel: ConnectThread["channel"];
  participants: ConnectThreadParticipant[];
  initialMessage?: {
    authorId: string;
    authorType: ConnectThreadMessage["authorType"];
    body: string;
  };
  links?: Array<{
    sourceSuite: ConnectSourceSuite;
    entityType: ConnectEventEntityType;
    entityId: string;
    siteId?: string;
    skuId?: string;
    batchId?: string;
    orderId?: string;
    reservationId?: string;
  }>;
}

export interface ConnectOpsCrmImportAccountPayload {
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

export interface ConnectOpsCrmImportContactPayload extends ConnectOpsRefs {
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

export interface ConnectOpsCrmImportPayload {
  accounts: ConnectOpsCrmImportAccountPayload[];
  contacts: ConnectOpsCrmImportContactPayload[];
  sourceLabel?: string;
}

export interface ConnectOpsCrmImportResult {
  accountsImported: number;
  contactsImported: number;
  importedAt: string;
  message?: string;
  boundaries?: {
    ownership?: string;
  };
}

export interface CreateConnectCampaignPayload {
  name: string;
  status?: ConnectCampaign["status"];
  channel?: ConnectCampaign["channel"];
  audienceLabel: string;
  audienceOpsAccountIds?: string[];
  ownerId: string;
  subject?: string;
  content: string;
  scheduledFor?: string;
}

export interface UpdateConnectCampaignStatusPayload {
  status: ConnectCampaign["status"];
}

export interface CreateConnectTimesheetEntryPayload {
  employeeId: string;
  siteId?: string;
  clockInAt?: string;
  breakMinutes?: number;
  notes?: string;
}

export interface ClockOutConnectTimesheetEntryPayload {
  clockOutAt?: string;
  breakMinutes?: number;
  notes?: string;
}

export interface UpdateConnectTimesheetStatusPayload {
  status: ConnectTimesheetEntry["status"];
  reviewerId?: string;
}

interface ConnectOverviewPayload {
  employees?: unknown;
  opsAccounts?: unknown;
  contacts?: unknown;
  tasks?: unknown;
  threads?: unknown;
  links?: unknown;
  activities?: unknown;
  updatedAt?: unknown;
  boundaries?: {
    os?: unknown;
    ops?: unknown;
  };
}

const DEFAULT_BOUNDARIES = {
  os: "OS remains source of truth for inventory, batches, and reservations.",
  ops: "OPS remains source of truth for CRM, order lifecycle, and logistics execution.",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const toStringValue = (value: unknown, fallback = ""): string =>
  toOptionalString(value) ?? fallback;

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((item) => toOptionalString(item))
    .filter((item): item is string => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
};

const toNumberValue = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toIsoDate = (value: unknown): string => {
  const normalized = toOptionalString(value);
  if (!normalized) {
    return new Date(0).toISOString();
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.valueOf())
    ? new Date(0).toISOString()
    : parsed.toISOString();
};

const normalizeOpsRefs = (value: Record<string, unknown>): ConnectOpsRefs => {
  const opsAccountId =
    toOptionalString(value.opsAccountId) ?? toOptionalString(value.accountId);
  return {
    opsAccountId,
    orderId: toOptionalString(value.orderId),
    deliveryId: toOptionalString(value.deliveryId),
    siteId: toOptionalString(value.siteId),
  };
};

const normalizeEventLink = (
  value: unknown,
  index: number,
): ConnectEventLink | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sourceSuite = toOptionalString(value.sourceSuite);
  const entityType = toOptionalString(value.entityType);
  const entityId = toOptionalString(value.entityId);

  if (!sourceSuite || !entityType || !entityId) {
    return null;
  }

  return {
    id: toStringValue(value.id, `link-${index}`),
    sourceSuite: ["os", "ops", "lab", "flow", "connect"].includes(sourceSuite)
      ? (sourceSuite as ConnectSourceSuite)
      : "connect",
    entityType: [
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
    ].includes(entityType)
      ? (entityType as ConnectEventEntityType)
      : "task",
    entityId,
    siteId: toOptionalString(value.siteId),
    skuId: toOptionalString(value.skuId),
    batchId: toOptionalString(value.batchId),
    orderId: toOptionalString(value.orderId),
    reservationId: toOptionalString(value.reservationId),
    createdAt: toIsoDate(value.createdAt),
  };
};

const normalizeLinks = (value: unknown): ConnectEventLink[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => normalizeEventLink(entry, index))
    .filter((entry): entry is ConnectEventLink => entry !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
    );
};

const normalizeEmployees = (value: unknown): ConnectEmployee[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectEmployee[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id);
    const displayName = toOptionalString(entry.displayName);
    const homeSiteId = toOptionalString(entry.homeSiteId);

    if (!id || !displayName || !homeSiteId) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const employee: ConnectEmployee = {
      id,
      displayName,
      status:
        status === "inactive" || status === "on_leave" ? status : "active",
      roles: toStringArray(entry.roles) ?? [],
      homeSiteId,
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
    };

    const email = toOptionalString(entry.email);
    if (email) {
      employee.email = email;
    }

    const phone = toOptionalString(entry.phone);
    if (phone) {
      employee.phone = phone;
    }

    const assignedSiteIds = toStringArray(entry.assignedSiteIds);
    if (assignedSiteIds) {
      employee.assignedSiteIds = assignedSiteIds;
    }

    normalized.push(employee);
  }

  return normalized.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

const normalizeOpsAccountStatus = (
  value: unknown,
): ConnectOpsAccount["status"] => {
  const status = toOptionalString(value);
  if (
    status === "prospect" ||
    status === "active" ||
    status === "inactive" ||
    status === "suspended"
  ) {
    return status;
  }
  return "active";
};

const normalizeOpsAccountType = (value: unknown): ConnectOpsAccount["type"] => {
  const type = toOptionalString(value);
  if (
    type === "retail" ||
    type === "bar" ||
    type === "restaurant" ||
    type === "distributor" ||
    type === "internal"
  ) {
    return type;
  }
  return "retail";
};

const normalizeOpsAccounts = (value: unknown): ConnectOpsAccount[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectOpsAccount[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `ops-account-${index}`;
    const name = toOptionalString(entry.name);
    if (!name) {
      continue;
    }

    const account: ConnectOpsAccount = {
      id,
      name,
      status: normalizeOpsAccountStatus(entry.status),
      type: normalizeOpsAccountType(entry.type),
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
    };

    const primarySiteId = toOptionalString(entry.primarySiteId);
    if (primarySiteId) {
      account.primarySiteId = primarySiteId;
    }

    const email = toOptionalString(entry.email);
    if (email) {
      account.email = email;
    }

    const phone = toOptionalString(entry.phone);
    if (phone) {
      account.phone = phone;
    }

    const address = toOptionalString(entry.address);
    if (address) {
      account.address = address;
    }

    normalized.push(account);
  }

  return normalized.sort((a, b) => a.name.localeCompare(b.name));
};

const normalizeContactChannels = (value: unknown): ConnectContactChannel[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectContactChannel[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const type = toOptionalString(entry.type);
    const channelValue = toOptionalString(entry.value);
    if (!type || !channelValue) {
      continue;
    }

    const channel: ConnectContactChannel = {
      type:
        type === "phone" ||
        type === "sms" ||
        type === "whatsapp" ||
        type === "slack" ||
        type === "other"
          ? type
          : "email",
      value: channelValue,
    };

    if (typeof entry.isPrimary === "boolean") {
      channel.isPrimary = entry.isPrimary;
    }

    normalized.push(channel);
  }

  return normalized;
};

const normalizeContacts = (value: unknown): ConnectContact[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectContact[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `contact-${index}`;
    const refs = normalizeOpsRefs(entry);
    const opsAccountId = refs.opsAccountId;
    const name = toOptionalString(entry.name);
    if (!opsAccountId || !name) {
      continue;
    }

    const channels = normalizeContactChannels(entry.channels);
    if (channels.length === 0) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const contact: ConnectContact = {
      id,
      opsAccountId,
      name,
      status: status === "inactive" ? "inactive" : "active",
      channels,
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
      ...refs,
    };

    const title = toOptionalString(entry.title);
    if (title) {
      contact.title = title;
    }

    const tags = toStringArray(entry.tags);
    if (tags) {
      contact.tags = tags;
    }

    normalized.push(contact);
  }

  return normalized.sort((a, b) => a.name.localeCompare(b.name));
};

const normalizeTasks = (value: unknown): ConnectTask[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectTask[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `task-${index}`;
    const title = toOptionalString(entry.title);
    const createdById = toOptionalString(entry.createdById);
    if (!title || !createdById) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const priority = toOptionalString(entry.priority);
    const taskType = toOptionalString(entry.taskType);

    const task: ConnectTask = {
      id,
      title,
      status:
        status === "in_progress" ||
        status === "blocked" ||
        status === "done" ||
        status === "canceled"
          ? status
          : "open",
      priority:
        priority === "low" || priority === "high" || priority === "critical"
          ? priority
          : "normal",
      createdById,
      links: normalizeLinks(entry.links),
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
      ...normalizeOpsRefs(entry),
    };

    const description = toOptionalString(entry.description);
    if (description) {
      task.description = description;
    }

    if (
      taskType === "communication" ||
      taskType === "delivery_followup" ||
      taskType === "inventory_check" ||
      taskType === "quality_hold" ||
      taskType === "customer_service" ||
      taskType === "compliance" ||
      taskType === "manual_override_review" ||
      taskType === "other"
    ) {
      task.taskType = taskType;
    }

    const assigneeIds = toStringArray(entry.assigneeIds);
    if (assigneeIds) {
      task.assigneeIds = assigneeIds;
    }

    const dueAt = toOptionalString(entry.dueAt);
    if (dueAt) {
      task.dueAt = toIsoDate(dueAt);
    }

    const closedAt = toOptionalString(entry.closedAt);
    if (closedAt) {
      task.closedAt = toIsoDate(closedAt);
    }

    normalized.push(task);
  }

  return normalized.sort(
    (a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  );
};

const normalizeThreadParticipants = (
  value: unknown,
): ConnectThreadParticipant[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectThreadParticipant[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const actorType = toOptionalString(entry.actorType);
    const actorId = toOptionalString(entry.actorId);
    const displayName = toOptionalString(entry.displayName);
    if (!actorId || !displayName) {
      continue;
    }

    normalized.push({
      actorType:
        actorType === "contact" || actorType === "system"
          ? actorType
          : "employee",
      actorId,
      displayName,
    });
  }

  return normalized;
};

const normalizeThreadMessages = (value: unknown): ConnectThreadMessage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectThreadMessage[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `message-${index}`;
    const authorId = toOptionalString(entry.authorId);
    const body = toOptionalString(entry.body);
    if (!authorId || !body) {
      continue;
    }

    const authorType = toOptionalString(entry.authorType);
    normalized.push({
      id,
      authorId,
      authorType:
        authorType === "contact" || authorType === "system"
          ? authorType
          : "employee",
      body,
      createdAt: toIsoDate(entry.createdAt),
    });
  }

  return normalized.sort(
    (a, b) => new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf(),
  );
};

const normalizeThreads = (value: unknown): ConnectThread[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectThread[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `thread-${index}`;
    const subject = toOptionalString(entry.subject);
    if (!subject) {
      continue;
    }

    const participants = normalizeThreadParticipants(entry.participants);
    if (participants.length === 0) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const channel = toOptionalString(entry.channel);
    const thread: ConnectThread = {
      id,
      subject,
      status:
        status === "waiting_external" ||
        status === "resolved" ||
        status === "closed"
          ? status
          : "open",
      channel:
        channel === "email" ||
        channel === "sms" ||
        channel === "phone" ||
        channel === "chat" ||
        channel === "other"
          ? channel
          : "internal",
      participants,
      messages: normalizeThreadMessages(entry.messages),
      links: normalizeLinks(entry.links),
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
      ...normalizeOpsRefs(entry),
    };

    normalized.push(thread);
  }

  return normalized.sort(
    (a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  );
};

const normalizeActivities = (value: unknown): ConnectActivity[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectActivity[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `activity-${index}`;
    const type = toOptionalString(entry.type);
    const entityType = toOptionalString(entry.entityType);
    const entityId = toOptionalString(entry.entityId);
    const actorType = toOptionalString(entry.actorType);
    const message = toOptionalString(entry.message);

    if (!type || !entityType || !entityId || !actorType || !message) {
      continue;
    }

    if (
      type !== "contact_created" &&
      type !== "task_created" &&
      type !== "task_status_changed" &&
      type !== "thread_created" &&
      type !== "thread_status_changed" &&
      type !== "thread_message_added"
    ) {
      continue;
    }

    if (
      entityType !== "contact" &&
      entityType !== "task" &&
      entityType !== "thread"
    ) {
      continue;
    }

    if (
      actorType !== "employee" &&
      actorType !== "contact" &&
      actorType !== "system"
    ) {
      continue;
    }

    normalized.push({
      id,
      type,
      entityType,
      entityId,
      actorType,
      actorId: toOptionalString(entry.actorId),
      message,
      createdAt: toIsoDate(entry.createdAt),
      ...normalizeOpsRefs(entry),
    });
  }

  return normalized.sort(
    (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  );
};

const normalizeCampaignMetrics = (value: unknown): ConnectCampaignMetrics => {
  if (!isRecord(value)) {
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
    };
  }

  return {
    sent: Math.max(0, toNumberValue(value.sent)),
    delivered: Math.max(0, toNumberValue(value.delivered)),
    opened: Math.max(0, toNumberValue(value.opened)),
    clicked: Math.max(0, toNumberValue(value.clicked)),
    replied: Math.max(0, toNumberValue(value.replied)),
  };
};

const normalizeCampaigns = (value: unknown): ConnectCampaign[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectCampaign[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `campaign-${index}`;
    const name = toOptionalString(entry.name);
    const audienceLabel = toOptionalString(entry.audienceLabel);
    const ownerId = toOptionalString(entry.ownerId);
    const content = toOptionalString(entry.content);
    if (!name || !audienceLabel || !ownerId || !content) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const channel = toOptionalString(entry.channel);

    const campaign: ConnectCampaign = {
      id,
      name,
      status:
        status === "scheduled" ||
        status === "running" ||
        status === "paused" ||
        status === "completed" ||
        status === "canceled"
          ? status
          : "draft",
      channel: channel === "sms" || channel === "internal" ? channel : "email",
      audienceLabel,
      ownerId,
      content,
      metrics: normalizeCampaignMetrics(entry.metrics),
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
    };

    const audienceOpsAccountIds = toStringArray(entry.audienceOpsAccountIds);
    if (audienceOpsAccountIds) {
      campaign.audienceOpsAccountIds = audienceOpsAccountIds;
    }

    const subject = toOptionalString(entry.subject);
    if (subject) {
      campaign.subject = subject;
    }

    const scheduledFor = toOptionalString(entry.scheduledFor);
    if (scheduledFor) {
      campaign.scheduledFor = toIsoDate(scheduledFor);
    }

    const launchedAt = toOptionalString(entry.launchedAt);
    if (launchedAt) {
      campaign.launchedAt = toIsoDate(launchedAt);
    }

    const completedAt = toOptionalString(entry.completedAt);
    if (completedAt) {
      campaign.completedAt = toIsoDate(completedAt);
    }

    normalized.push(campaign);
  }

  return normalized.sort(
    (a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  );
};

const normalizeTimesheetEntries = (value: unknown): ConnectTimesheetEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: ConnectTimesheetEntry[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      continue;
    }

    const id = toOptionalString(entry.id) ?? `timesheet-${index}`;
    const employeeId = toOptionalString(entry.employeeId);
    const clockInAt = toOptionalString(entry.clockInAt);
    if (!employeeId || !clockInAt) {
      continue;
    }

    const status = toOptionalString(entry.status);
    const row: ConnectTimesheetEntry = {
      id,
      employeeId,
      status:
        status === "submitted" || status === "approved" || status === "rejected"
          ? status
          : "open",
      clockInAt: toIsoDate(clockInAt),
      breakMinutes: Math.max(0, toNumberValue(entry.breakMinutes)),
      createdAt: toIsoDate(entry.createdAt),
      updatedAt: toIsoDate(entry.updatedAt),
    };

    const siteId = toOptionalString(entry.siteId);
    if (siteId) {
      row.siteId = siteId;
    }

    const clockOutAt = toOptionalString(entry.clockOutAt);
    if (clockOutAt) {
      row.clockOutAt = toIsoDate(clockOutAt);
    }

    const notes = toOptionalString(entry.notes);
    if (notes) {
      row.notes = notes;
    }

    const submittedAt = toOptionalString(entry.submittedAt);
    if (submittedAt) {
      row.submittedAt = toIsoDate(submittedAt);
    }

    const approvedAt = toOptionalString(entry.approvedAt);
    if (approvedAt) {
      row.approvedAt = toIsoDate(approvedAt);
    }

    const approvedById = toOptionalString(entry.approvedById);
    if (approvedById) {
      row.approvedById = approvedById;
    }

    normalized.push(row);
  }

  return normalized.sort(
    (a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  );
};

const normalizeConnectOverview = (payload: unknown): ConnectOverview => {
  const data = isRecord(payload) ? (payload as ConnectOverviewPayload) : {};

  return {
    employees: normalizeEmployees(data.employees),
    opsAccounts: normalizeOpsAccounts(data.opsAccounts),
    contacts: normalizeContacts(data.contacts),
    tasks: normalizeTasks(data.tasks),
    threads: normalizeThreads(data.threads),
    links: normalizeLinks(data.links),
    activities: normalizeActivities(data.activities),
    updatedAt: toIsoDate(data.updatedAt),
    boundaries: {
      os: toStringValue(data.boundaries?.os, DEFAULT_BOUNDARIES.os),
      ops: toStringValue(data.boundaries?.ops, DEFAULT_BOUNDARIES.ops),
    },
  };
};

const toPrimaryContactChannels = (
  emailValue: string | undefined,
  phoneValue: string | undefined,
): ConnectContactChannel[] => {
  const channels: ConnectContactChannel[] = [];
  if (emailValue) {
    channels.push({
      type: "email",
      value: emailValue,
      isPrimary: true,
    });
  }
  if (phoneValue) {
    channels.push({
      type: "phone",
      value: phoneValue,
      isPrimary: channels.length === 0,
    });
  }
  return channels;
};

const buildAddressLine = (
  address: string,
  city: string,
  state: string,
  zip: string,
): string | undefined => {
  const normalizedAddress = toOptionalString(address);
  const normalizedCity = toOptionalString(city);
  const normalizedState = toOptionalString(state);
  const normalizedZip = toOptionalString(zip);

  const locality = [normalizedCity, normalizedState]
    .filter((item): item is string => Boolean(item))
    .join(", ");

  const parts = [normalizedAddress, locality, normalizedZip].filter(
    (item): item is string => Boolean(item),
  );

  return parts.length > 0 ? parts.join(" ").trim() : undefined;
};

const upsertImportAccount = (
  accountMap: Map<string, ConnectOpsCrmImportAccountPayload>,
  account: ConnectOpsCrmImportAccountPayload,
) => {
  const existing = accountMap.get(account.id);
  if (!existing) {
    accountMap.set(account.id, account);
    return;
  }

  const existingStamp = new Date(
    existing.updatedAt ?? existing.createdAt ?? 0,
  ).valueOf();
  const nextStamp = new Date(
    account.updatedAt ?? account.createdAt ?? 0,
  ).valueOf();
  if (nextStamp >= existingStamp) {
    accountMap.set(account.id, account);
  }
};

const upsertImportContact = (
  contactMap: Map<string, ConnectOpsCrmImportContactPayload>,
  contact: ConnectOpsCrmImportContactPayload,
) => {
  const existing = contactMap.get(contact.id);
  if (!existing) {
    contactMap.set(contact.id, contact);
    return;
  }

  const existingStamp = new Date(
    existing.updatedAt ?? existing.createdAt ?? 0,
  ).valueOf();
  const nextStamp = new Date(
    contact.updatedAt ?? contact.createdAt ?? 0,
  ).valueOf();
  if (nextStamp >= existingStamp) {
    contactMap.set(contact.id, contact);
  }
};

const leadStageToAccountStatus = (
  stage: string,
): ConnectOpsAccount["status"] => {
  if (stage === "converted") {
    return "active";
  }
  if (stage === "lost") {
    return "inactive";
  }
  return "prospect";
};

const prospectStatusToAccountStatus = (
  status: string,
): ConnectOpsAccount["status"] => {
  if (status === "disqualified") {
    return "inactive";
  }
  return "prospect";
};

export function buildConnectOpsCrmImportPayloadFromLocalStorage(
  sourceLabel = "ops-crm-localstorage-v1",
): ConnectOpsCrmImportPayload {
  const accountMap = new Map<string, ConnectOpsCrmImportAccountPayload>();
  const contactMap = new Map<string, ConnectOpsCrmImportContactPayload>();

  for (const client of getOpsClientRecords()) {
    const account: ConnectOpsCrmImportAccountPayload = {
      id: client.id,
      name: client.name,
      status: client.status === "inactive" ? "inactive" : "active",
      type: "retail",
      primarySiteId: client.id,
      email: toOptionalString(client.email),
      phone: toOptionalString(client.phone),
      address: buildAddressLine(
        client.address,
        client.city,
        client.state,
        client.zip,
      ),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "client",
        sourceRecordId: client.id,
        googlePlaceId: client.googlePlaceId,
        notes: client.notes,
      },
    };
    upsertImportAccount(accountMap, account);

    const channels = toPrimaryContactChannels(
      toOptionalString(client.email),
      toOptionalString(client.phone),
    );
    if (channels.length === 0) {
      continue;
    }

    const contactName = toOptionalString(client.contactName) ?? client.name;
    const contact: ConnectOpsCrmImportContactPayload = {
      id: `${client.id}-contact-primary`,
      opsAccountId: client.id,
      name: contactName,
      title: "Primary Contact",
      status: client.status === "inactive" ? "inactive" : "active",
      channels,
      tags: ["ops-client-import"],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      siteId: client.id,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "client",
        sourceRecordId: client.id,
      },
    };
    upsertImportContact(contactMap, contact);
  }

  for (const lead of getOpsLeadRecords()) {
    const account: ConnectOpsCrmImportAccountPayload = {
      id: lead.id,
      name: lead.name,
      status: leadStageToAccountStatus(lead.stage),
      type: "restaurant",
      primarySiteId: lead.id,
      email: toOptionalString(lead.email),
      phone: toOptionalString(lead.phone),
      address: buildAddressLine(lead.address, lead.city, lead.state, lead.zip),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "lead",
        sourceRecordId: lead.id,
        owner: lead.owner,
        stage: lead.stage,
        source: lead.source,
        website: lead.website,
        googlePlaceId: lead.googlePlaceId,
      },
    };
    upsertImportAccount(accountMap, account);

    const channels = toPrimaryContactChannels(
      toOptionalString(lead.email),
      toOptionalString(lead.phone),
    );
    if (channels.length === 0) {
      continue;
    }

    const contactName = toOptionalString(lead.owner) ?? lead.name;
    const contact: ConnectOpsCrmImportContactPayload = {
      id: `${lead.id}-contact-primary`,
      opsAccountId: lead.id,
      name: contactName,
      title: "Lead Owner",
      status: lead.stage === "lost" ? "inactive" : "active",
      channels,
      tags: ["ops-lead-import", `stage:${lead.stage}`],
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "lead",
        sourceRecordId: lead.id,
      },
    };
    upsertImportContact(contactMap, contact);
  }

  for (const prospect of getOpsProspectRecords()) {
    const account: ConnectOpsCrmImportAccountPayload = {
      id: prospect.id,
      name: prospect.name,
      status: prospectStatusToAccountStatus(prospect.status),
      type: "restaurant",
      primarySiteId: prospect.id,
      email: toOptionalString(prospect.email),
      phone: toOptionalString(prospect.phone),
      address: buildAddressLine(
        prospect.address,
        prospect.city,
        prospect.state,
        prospect.zip,
      ),
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "prospect",
        sourceRecordId: prospect.id,
        owner: prospect.owner,
        status: prospect.status,
        source: prospect.source,
        website: prospect.website,
        googlePlaceId: prospect.googlePlaceId,
        lastTouchAt: prospect.lastTouchAt,
        nextTaskAt: prospect.nextTaskAt,
      },
    };
    upsertImportAccount(accountMap, account);

    const channels = toPrimaryContactChannels(
      toOptionalString(prospect.email),
      toOptionalString(prospect.phone),
    );
    if (channels.length === 0) {
      continue;
    }

    const contactName = toOptionalString(prospect.owner) ?? prospect.name;
    const contact: ConnectOpsCrmImportContactPayload = {
      id: `${prospect.id}-contact-primary`,
      opsAccountId: prospect.id,
      name: contactName,
      title: "Prospect Owner",
      status: prospect.status === "disqualified" ? "inactive" : "active",
      channels,
      tags: ["ops-prospect-import", `status:${prospect.status}`],
      createdAt: prospect.createdAt,
      updatedAt: prospect.updatedAt,
      metadata: {
        sourceSuite: "ops",
        sourceEntityType: "prospect",
        sourceRecordId: prospect.id,
      },
    };
    upsertImportContact(contactMap, contact);
  }

  return {
    sourceLabel,
    accounts: Array.from(accountMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    contacts: Array.from(contactMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

const extractEntity = <T>(
  payload: unknown,
  key: string,
  normalize: (value: unknown) => T,
): T => {
  if (!isRecord(payload) || !(key in payload)) {
    throw new Error(`Missing ${key} in API response`);
  }
  return normalize(payload[key]);
};

const extractCollection = <T>(
  payload: unknown,
  key: string,
  normalize: (value: unknown) => T[],
): T[] => {
  if (!isRecord(payload) || !(key in payload)) {
    throw new Error(`Missing ${key} in API response`);
  }
  return normalize(payload[key]);
};

const normalizeTaskResponse = (value: unknown): ConnectTask => {
  const [task] = normalizeTasks([value]);
  if (!task) {
    throw new Error("Invalid task payload");
  }
  return task;
};

const normalizeThreadResponse = (value: unknown): ConnectThread => {
  const [thread] = normalizeThreads([value]);
  if (!thread) {
    throw new Error("Invalid thread payload");
  }
  return thread;
};

const normalizeEmployeeResponse = (value: unknown): ConnectEmployee => {
  const [employee] = normalizeEmployees([value]);
  if (!employee) {
    throw new Error("Invalid employee payload");
  }
  return employee;
};

const normalizeCampaignResponse = (value: unknown): ConnectCampaign => {
  const [campaign] = normalizeCampaigns([value]);
  if (!campaign) {
    throw new Error("Invalid campaign payload");
  }
  return campaign;
};

const normalizeTimesheetEntryResponse = (
  value: unknown,
): ConnectTimesheetEntry => {
  const [entry] = normalizeTimesheetEntries([value]);
  if (!entry) {
    throw new Error("Invalid timesheet payload");
  }
  return entry;
};

export async function fetchConnectOverview(): Promise<ConnectOverview> {
  const payload = await apiGet<unknown>("/api/connect/overview");
  return normalizeConnectOverview(payload);
}

const normalizeConnectOpsCrmImportResult = (
  payload: unknown,
): ConnectOpsCrmImportResult => {
  if (!isRecord(payload)) {
    throw new Error("Invalid OPS CRM import response");
  }

  const boundaries = isRecord(payload.boundaries)
    ? {
        ownership: toOptionalString(payload.boundaries.ownership),
      }
    : undefined;

  return {
    accountsImported: toNumberValue(payload.accountsImported),
    contactsImported: toNumberValue(payload.contactsImported),
    importedAt: toIsoDate(payload.importedAt),
    message: toOptionalString(payload.message),
    boundaries,
  };
};

export async function importConnectOpsCrmSnapshot(
  payload: ConnectOpsCrmImportPayload,
): Promise<ConnectOpsCrmImportResult> {
  const response = await apiPost<unknown>(
    "/api/connect/import/ops-crm",
    payload,
  );
  return normalizeConnectOpsCrmImportResult(response);
}

export async function createConnectEmployee(
  payload: CreateConnectEmployeePayload,
): Promise<ConnectEmployee> {
  const response = await apiPost<unknown>("/api/connect/employees", payload);
  return extractEntity(response, "employee", normalizeEmployeeResponse);
}

export async function updateConnectEmployee(
  employeeId: string,
  payload: UpdateConnectEmployeePayload,
): Promise<ConnectEmployee> {
  const response = await apiPatch<unknown>(
    `/api/connect/employees/${encodeURIComponent(employeeId)}`,
    payload,
  );
  return extractEntity(response, "employee", normalizeEmployeeResponse);
}

export async function fetchConnectCampaigns(): Promise<ConnectCampaign[]> {
  const payload = await apiGet<unknown>("/api/connect/campaigns");
  return extractCollection(payload, "campaigns", normalizeCampaigns);
}

export async function createConnectCampaign(
  payload: CreateConnectCampaignPayload,
): Promise<ConnectCampaign> {
  const response = await apiPost<unknown>("/api/connect/campaigns", payload);
  return extractEntity(response, "campaign", normalizeCampaignResponse);
}

export async function updateConnectCampaignStatus(
  campaignId: string,
  payload: UpdateConnectCampaignStatusPayload,
): Promise<ConnectCampaign> {
  const response = await apiPatch<unknown>(
    `/api/connect/campaigns/${encodeURIComponent(campaignId)}/status`,
    payload,
  );
  return extractEntity(response, "campaign", normalizeCampaignResponse);
}

export async function fetchConnectTimesheetEntries(): Promise<
  ConnectTimesheetEntry[]
> {
  const payload = await apiGet<unknown>("/api/connect/timesheets");
  return extractCollection(payload, "entries", normalizeTimesheetEntries);
}

export async function createConnectTimesheetEntry(
  payload: CreateConnectTimesheetEntryPayload,
): Promise<ConnectTimesheetEntry> {
  const response = await apiPost<unknown>("/api/connect/timesheets", payload);
  return extractEntity(response, "entry", normalizeTimesheetEntryResponse);
}

export async function clockOutConnectTimesheetEntry(
  entryId: string,
  payload: ClockOutConnectTimesheetEntryPayload,
): Promise<ConnectTimesheetEntry> {
  const response = await apiPost<unknown>(
    `/api/connect/timesheets/${encodeURIComponent(entryId)}/clock-out`,
    payload,
  );
  return extractEntity(response, "entry", normalizeTimesheetEntryResponse);
}

export async function updateConnectTimesheetStatus(
  entryId: string,
  payload: UpdateConnectTimesheetStatusPayload,
): Promise<ConnectTimesheetEntry> {
  const response = await apiPatch<unknown>(
    `/api/connect/timesheets/${encodeURIComponent(entryId)}/status`,
    payload,
  );
  return extractEntity(response, "entry", normalizeTimesheetEntryResponse);
}

export async function createConnectTask(
  payload: CreateConnectTaskPayload,
): Promise<ConnectTask> {
  const response = await apiPost<unknown>("/api/connect/tasks", payload);
  return extractEntity(response, "task", normalizeTaskResponse);
}

export async function updateConnectTaskStatus(
  taskId: string,
  status: ConnectTask["status"],
): Promise<ConnectTask> {
  const response = await apiPatch<unknown>(
    `/api/connect/tasks/${encodeURIComponent(taskId)}/status`,
    { status },
  );
  return extractEntity(response, "task", normalizeTaskResponse);
}

export async function createConnectThread(
  payload: CreateConnectThreadPayload,
): Promise<ConnectThread> {
  const response = await apiPost<unknown>("/api/connect/threads", payload);
  return extractEntity(response, "thread", normalizeThreadResponse);
}

export async function updateConnectThreadStatus(
  threadId: string,
  status: ConnectThread["status"],
): Promise<ConnectThread> {
  const response = await apiPatch<unknown>(
    `/api/connect/threads/${encodeURIComponent(threadId)}/status`,
    { status },
  );
  return extractEntity(response, "thread", normalizeThreadResponse);
}

export async function appendConnectThreadMessage(
  threadId: string,
  payload: {
    authorId: string;
    authorType: ConnectThreadMessage["authorType"];
    body: string;
  },
): Promise<ConnectThread> {
  const response = await apiPost<unknown>(
    `/api/connect/threads/${encodeURIComponent(threadId)}/messages`,
    payload,
  );
  return extractEntity(response, "thread", normalizeThreadResponse);
}
