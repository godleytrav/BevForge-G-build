import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiPost, createIdempotencyHeaders } from '@/lib/api';
import { postOpsCalendarEvent, type OpsCalendarEventStatus } from '@/lib/ops-calendar';
import { Building2, ClipboardList, FileText, FlaskConical, Map as MapIcon, Route, Truck, Users } from 'lucide-react';
import {
  buildRouteSummaries,
  buildSiteSummaries,
  buildTruckAssignments,
  fetchFleetProfiles,
  fetchLogisticsOrders,
  getSiteProfile,
  getTruckPlanningPreferences,
  type LogisticsOrder,
  type LogisticsTruckProfile,
  type TruckPlanningPreference,
} from '../logistics/data';
import { buildRouteStopSummaries, buildSiteDeliveryStatusMap } from '../logistics/route-status';
import {
  findOpsLeadDuplicate,
  getOpsClientRecords,
  getOpsCrmActivitiesForEntity,
  getOpsCrmSampleOrdersForEntity,
  getOpsCrmSalesVisitsForEntity,
  getOpsCrmTasksForEntity,
  getOpsLeadRecords,
  loadOpsCrmState,
  getOpsProspectRecord,
  getOpsProspectRecords,
  saveOpsCrmActivityRecord,
  saveOpsCrmSampleOrderRecord,
  saveOpsCrmSalesVisitRecord,
  saveOpsCrmTaskRecord,
  saveOpsLeadRecord,
  saveOpsProspectRecord,
  type OpsCrmEntityRef,
  type OpsCrmSampleOrderItem,
  type OpsCrmSampleOrderStatus,
  type OpsCrmTaskStatus,
  type OpsCrmVisitStatus,
  type OpsClientRecord,
  type OpsLeadRecord,
  type OpsLeadStage,
  type OpsProspectRecord,
} from './data';
import {
  GeoMapSurface,
  type GeoLineStatus,
  type GeoMapClickPoint,
  type GeoMarker,
  type GeoPolyline,
} from '../geo/GeoMapSurface';
import {
  dedupeProspects,
  getSeedProspectCandidates,
  resolveGeoPoint,
  type GeoPoint,
  type OpsProspectCandidate,
} from '../geo/map-data';
import { useGoogleApiUsageSnapshot } from '../geo/use-google-api-usage';
import { fetchPlaceDetailsOnImport } from '../geo/google-places';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

interface LeadFormState {
  id?: string;
  name: string;
  owner: string;
  stage: OpsLeadStage;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  source: 'manual' | 'map';
  googlePlaceId?: string;
  lat: number;
  lng: number;
}

interface MarkerDetail {
  marker: GeoMarker;
  kind: 'lead' | 'prospect' | 'customer' | 'delivery';
  lead?: OpsLeadRecord;
  prospect?: OpsProspectCandidate;
  customer?: {
    id: string;
    name: string;
    address: string;
    activeOrders: number;
    deliveredOrders: number;
  };
  delivery?: {
    routeLabel: string;
    status: string;
    stopsAhead: number;
    truckName?: string;
  };
}

interface DrawerEntity {
  entityRef: OpsCrmEntityRef;
  name: string;
  statusLabel: string;
  ownerLabel?: string;
  contactLine?: string;
  address?: string;
}

interface TaskFormState {
  title: string;
  dueAt: string;
  urgent: boolean;
  assignedUserId: string;
  status: OpsCrmTaskStatus;
  notes: string;
}

interface ActivityFormState {
  type: string;
  at: string;
  note: string;
  actor: string;
}

interface SalesVisitFormState {
  salesperson: string;
  date: string;
  startTime: string;
  latestStartTime: string;
  duration: string;
  status: OpsCrmVisitStatus;
  notes: string;
}

interface ProductOption {
  id: string;
  name: string;
}

interface SampleOrderFormState {
  status: OpsCrmSampleOrderStatus;
  notes: string;
  productId: string;
  quantity: number;
  items: OpsCrmSampleOrderItem[];
}

type SampleOrderToOpsStatus = 'draft' | 'submitted' | 'cancelled';

const toDateTimeLocal = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  const hour = `${value.getHours()}`.padStart(2, '0');
  const minute = `${value.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toDateLocal = (value: Date = new Date()): string => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sampleOrderStatusToOpsOrderStatus = (
  status: OpsCrmSampleOrderStatus
): SampleOrderToOpsStatus => {
  if (status === 'submitted') {
    return 'submitted';
  }
  if (status === 'cancelled') {
    return 'cancelled';
  }
  return 'draft';
};

const taskStatusToCalendarStatus = (status: OpsCrmTaskStatus): OpsCalendarEventStatus => {
  if (status === 'completed') {
    return 'completed';
  }
  if (status === 'cancelled') {
    return 'canceled';
  }
  return 'planned';
};

const visitStatusToCalendarStatus = (status: OpsCrmVisitStatus): OpsCalendarEventStatus => {
  if (status === 'completed') {
    return 'completed';
  }
  if (status === 'cancelled') {
    return 'canceled';
  }
  return 'planned';
};

const toIsoFromDateAndTime = (dateText: string, timeText: string): string | null => {
  const [year, month, day] = dateText.split('-').map((value) => Number(value));
  const [hours, minutes] = timeText.split(':').map((value) => Number(value));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  const next = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(next.getTime())) {
    return null;
  }
  return next.toISOString();
};

const parseDurationMinutes = (durationText: string): number | null => {
  const text = durationText.trim().toLowerCase();
  if (!text) {
    return null;
  }

  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutesMatch = text.match(/(\d+(?:\.\d+)?)\s*m/);
  const plainMinutes = text.match(/^(\d+)$/);

  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : plainMinutes ? Number(plainMinutes[1]) : 0;
  const total = Math.round(hours * 60 + minutes);
  return Number.isFinite(total) && total > 0 ? total : null;
};

const addMinutesToIso = (startIso: string, minutes: number): string | undefined => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return undefined;
  }
  const startMs = Date.parse(startIso);
  if (!Number.isFinite(startMs)) {
    return undefined;
  }
  return new Date(startMs + minutes * 60 * 1000).toISOString();
};

const defaultLeadForm = (point?: GeoPoint): LeadFormState => ({
  name: '',
  owner: '',
  stage: 'prospect',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: 'CA',
  zip: '',
  notes: '',
  source: 'map',
  googlePlaceId: '',
  lat: point?.lat ?? 38.5816,
  lng: point?.lng ?? -121.4944,
});

const parseAddressParts = (
  formattedAddress: string
): Partial<Pick<LeadFormState, 'city' | 'state' | 'zip'>> => {
  const parts = formattedAddress
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) {
    return {};
  }

  const stateZipPart = parts.length >= 2 ? parts[parts.length - 2] : '';
  const cityPart = parts.length >= 3 ? parts[parts.length - 3] : undefined;
  const stateZipMatch = stateZipPart.match(/\b([A-Z]{2})\b(?:\s+(\d{5}(?:-\d{4})?))?/);

  return {
    city: cityPart,
    state: stateZipMatch?.[1],
    zip: stateZipMatch?.[2],
  };
};

const normalizeText = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const stageBadgeClass = (stage: OpsLeadStage): string => {
  switch (stage) {
    case 'qualified':
      return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200';
    case 'proposal':
      return 'border-blue-500/40 bg-blue-500/20 text-blue-200';
    case 'converted':
      return 'border-cyan-500/40 bg-cyan-500/20 text-cyan-200';
    case 'lost':
      return 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300';
    case 'contacted':
      return 'border-amber-500/40 bg-amber-500/20 text-amber-200';
    default:
      return 'border-violet-500/40 bg-violet-500/20 text-violet-200';
  }
};

export default function OpsCrmHomePage() {
  const navigate = useNavigate();
  const googleApiUsage = useGoogleApiUsageSnapshot();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [fleet, setFleet] = useState<LogisticsTruckProfile[]>([]);
  const [planningPreferences, setPlanningPreferences] = useState<TruckPlanningPreference[]>([]);
  const [clientRecords, setClientRecords] = useState<OpsClientRecord[]>([]);
  const [leadRecords, setLeadRecords] = useState<OpsLeadRecord[]>([]);
  const [prospectRecords, setProspectRecords] = useState<OpsProspectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showLeads, setShowLeads] = useState(true);
  const [showProspects, setShowProspects] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showDeliveries, setShowDeliveries] = useState(true);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>(undefined);
  const [entityDrawerOpen, setEntityDrawerOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(defaultLeadForm());
  const [placeImportPending, setPlaceImportPending] = useState(false);
  const [placeImportMessage, setPlaceImportMessage] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [sampleOrderDialogOpen, setSampleOrderDialogOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [sampleOrderSubmitting, setSampleOrderSubmitting] = useState(false);
  const [sampleOrderError, setSampleOrderError] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>({
    title: '',
    dueAt: toDateTimeLocal(),
    urgent: false,
    assignedUserId: 'Travis Partlow',
    status: 'open',
    notes: '',
  });
  const [activityForm, setActivityForm] = useState<ActivityFormState>({
    type: 'note',
    at: toDateTimeLocal(),
    note: '',
    actor: 'Travis Partlow',
  });
  const [visitForm, setVisitForm] = useState<SalesVisitFormState>({
    salesperson: 'Travis Partlow',
    date: toDateLocal(),
    startTime: '09:00',
    latestStartTime: '',
    duration: '1h',
    status: 'planned',
    notes: '',
  });
  const [sampleOrderForm, setSampleOrderForm] = useState<SampleOrderFormState>({
    status: 'draft',
    notes: '',
    productId: '',
    quantity: 1,
    items: [],
  });

  const refreshCrmRecords = useCallback(() => {
    setClientRecords(getOpsClientRecords());
    setLeadRecords(getOpsLeadRecords());
    setProspectRecords(getOpsProspectRecords());
  }, []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [nextOrders, nextFleet] = await Promise.all([
          fetchLogisticsOrders(),
          fetchFleetProfiles(),
          loadOpsCrmState(),
        ]);
        if (!active) {
          return;
        }
        setOrders(nextOrders);
        setFleet(nextFleet);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load CRM logistics context:', error);
        setOrders([]);
        setFleet([]);
      } finally {
        if (active) {
          setPlanningPreferences(getTruckPlanningPreferences());
          refreshCrmRecords();
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshCrmRecords]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCrmRecords();
      }
    };

    window.addEventListener('focus', refreshCrmRecords);
    window.addEventListener('storage', refreshCrmRecords);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', refreshCrmRecords);
      window.removeEventListener('storage', refreshCrmRecords);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshCrmRecords]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await globalThis.fetch('/api/inventory/products');
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as unknown;
        const rows = Array.isArray(payload)
          ? payload
          : typeof payload === 'object' && payload !== null && 'data' in (payload as Record<string, unknown>)
            ? ((payload as { data?: unknown }).data as unknown[])
            : [];

        const parsed = Array.isArray(rows)
          ? rows
              .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
              .map((row) => ({
                id: String(row.id ?? row.product_id ?? row.sku ?? ''),
                name: String(row.name ?? row.product_name ?? row.title ?? ''),
              }))
              .filter((row) => row.id.length > 0 && row.name.length > 0)
          : [];

        if (active) {
          setProductOptions(parsed);
        }
      } catch {
        if (active) {
          setProductOptions([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const siteSummaries = useMemo(() => buildSiteSummaries(orders), [orders]);
  const routeSummaries = useMemo(() => buildRouteSummaries(orders), [orders]);

  const truckAssignments = useMemo(() => {
    return buildTruckAssignments(routeSummaries, fleet, planningPreferences);
  }, [routeSummaries, fleet, planningPreferences]);

  const deliveryStatusBySite = useMemo(() => {
    return buildSiteDeliveryStatusMap(routeSummaries, truckAssignments);
  }, [routeSummaries, truckAssignments]);

  const clientViews = useMemo(() => {
    const siteMap = new Map(siteSummaries.map((site) => [site.id, site]));
    const localMap = new Map(clientRecords.map((record) => [record.id, record]));
    const ids = new Set<string>([...siteMap.keys(), ...localMap.keys()]);

    return Array.from(ids)
      .map((id) => {
        const site = siteMap.get(id);
        const local = localMap.get(id);
        const profile = getSiteProfile(id, local?.name ?? site?.name ?? id);
        const deliveredValue = (site?.orders ?? [])
          .filter((order) => order.status === 'delivered')
          .reduce((sum, order) => sum + order.totalAmount, 0);

        return {
          id,
          status: local?.status || 'active',
          deliveredValue,
          activeOrderCount: site?.activeOrderCount ?? 0,
          name: local?.name || site?.name || profile.siteName || id,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [siteSummaries, clientRecords]);

  const summary = useMemo(() => {
    const deliveredValue = clientViews.reduce((sum, client) => sum + client.deliveredValue, 0);
    const activeAccounts = clientViews.filter((client) => client.status === 'active').length;

    const activeDeliverySiteIds = new Set(
      Object.values(deliveryStatusBySite)
        .filter((snapshot) => snapshot.status === 'in-route')
        .map((snapshot) => snapshot.siteId)
    );

    orders.forEach((order) => {
      if (order.status === 'in-delivery' || order.status === 'loaded') {
        activeDeliverySiteIds.add(order.customerId || order.customerName);
      }
    });

    return {
      totalClients: clientViews.length,
      activeAccounts,
      localProfiles: clientRecords.length,
      deliveredValue,
      leadCount: leadRecords.length,
      activeDeliveries: activeDeliverySiteIds.size,
    };
  }, [clientViews, clientRecords.length, leadRecords.length, deliveryStatusBySite, orders]);

  const prospectCandidates = useMemo(() => {
    const seed = dedupeProspects(getSeedProspectCandidates(), leadRecords, clientRecords);
    const fromRecords: OpsProspectCandidate[] = prospectRecords.map((prospect) => ({
      id: prospect.id,
      name: prospect.name,
      address: prospect.address,
      city: prospect.city,
      state: prospect.state,
      zip: prospect.zip,
      phone: prospect.phone,
      website: prospect.website,
      description: prospect.notes,
      openingHours: [],
      point: resolveGeoPoint({
        idSeed: prospect.id,
        name: prospect.name,
        address: prospect.address,
        city: prospect.city,
        state: prospect.state,
        lat: prospect.lat,
        lng: prospect.lng,
      }),
    }));

    const merged = new Map<string, OpsProspectCandidate>();
    fromRecords.forEach((entry) => merged.set(entry.id, entry));
    seed.forEach((entry) => {
      const duplicate = Array.from(merged.values()).find((existing) => {
        return (
          normalizeText(existing.name) === normalizeText(entry.name) &&
          normalizeText(existing.address) === normalizeText(entry.address)
        );
      });
      if (!duplicate) {
        merged.set(entry.id, entry);
      }
    });

    return Array.from(merged.values());
  }, [leadRecords, clientRecords, prospectRecords]);

  const customerMarkers = useMemo<GeoMarker[]>(() => {
    const siteById = new Map(siteSummaries.map((site) => [site.id, site]));
    const clientById = new Map(clientRecords.map((client) => [client.id, client]));
    const ids = new Set<string>([...siteById.keys(), ...clientById.keys()]);

    return Array.from(ids).map((id) => {
      const site = siteById.get(id);
      const client = clientById.get(id);
      const name = client?.name || site?.name || id;
      const point = resolveGeoPoint({
        idSeed: id,
        name,
        address: client?.address,
        city: client?.city,
        state: client?.state,
        lat: client?.lat,
        lng: client?.lng,
      });
      const deliverySnapshot = deliveryStatusBySite[id];

      return {
        id: `customer-${id}`,
        type: 'customer',
        title: name,
        subtitle: deliverySnapshot
          ? `${deliverySnapshot.status} · ${deliverySnapshot.routeLabel}`
          : site?.activeOrderCount
            ? `${site.activeOrderCount} active orders`
            : 'No active deliveries',
        status: deliverySnapshot?.status ?? 'stable',
        point,
      } satisfies GeoMarker;
    });
  }, [siteSummaries, clientRecords, deliveryStatusBySite]);

  const deliveryMarkers = useMemo<GeoMarker[]>(() => {
    return Object.values(deliveryStatusBySite).map((snapshot) => {
      const client = clientRecords.find((entry) => entry.id === snapshot.siteId);
      return {
        id: `delivery-${snapshot.siteId}`,
        type: 'delivery-stop',
        title: snapshot.siteName,
        subtitle:
          snapshot.status === 'in-route'
            ? `${snapshot.routeLabel} · ${snapshot.stopsAhead} stops ahead`
            : snapshot.routeLabel,
        status: snapshot.status,
        point: resolveGeoPoint({
          idSeed: snapshot.siteId,
          name: snapshot.siteName,
          address: client?.address,
          city: client?.city,
          state: client?.state,
        }),
      } satisfies GeoMarker;
    });
  }, [deliveryStatusBySite, clientRecords]);

  const leadMarkers = useMemo<GeoMarker[]>(() => {
    return leadRecords.map((lead) => ({
      id: `lead-${lead.id}`,
      type: 'lead',
      title: lead.name,
      subtitle: `${lead.stage} · ${lead.owner || 'Unassigned'}`,
      status: lead.stage,
      point: resolveGeoPoint({
        idSeed: lead.id,
        name: lead.name,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        lat: lead.lat,
        lng: lead.lng,
      }),
    }));
  }, [leadRecords]);

  const prospectMarkers = useMemo<GeoMarker[]>(() => {
    return prospectCandidates.map((candidate) => ({
      id: `prospect-${candidate.id}`,
      type: 'prospect',
      title: candidate.name,
      subtitle: `${candidate.city}, ${candidate.state}`,
      status: 'prospect',
      point: candidate.point,
    }));
  }, [prospectCandidates]);

  const routePolylines = useMemo<GeoPolyline[]>(() => {
    return routeSummaries
      .map((route) => {
        const stops = buildRouteStopSummaries(route, truckAssignments);
        const points = stops.map((stop) =>
          resolveGeoPoint({
            idSeed: stop.siteId,
            name: stop.siteName,
          })
        );
        const status: GeoLineStatus =
          route.status === 'completed'
            ? 'completed'
            : route.status === 'in-progress'
              ? 'active'
              : 'planned';

        return {
          id: `line-${route.id}`,
          points,
          status,
        } satisfies GeoPolyline;
      })
      .filter((line) => line.points.length > 1);
  }, [routeSummaries, truckAssignments]);

  const mapMarkers = useMemo<GeoMarker[]>(() => {
    return [
      ...(showCustomers ? customerMarkers : []),
      ...(showDeliveries ? deliveryMarkers : []),
      ...(showLeads ? leadMarkers : []),
      ...(showProspects ? prospectMarkers : []),
    ];
  }, [showCustomers, showDeliveries, showLeads, showProspects, customerMarkers, deliveryMarkers, leadMarkers, prospectMarkers]);

  const markerDetails = useMemo<Map<string, MarkerDetail>>(() => {
    const map = new Map<string, MarkerDetail>();

    leadMarkers.forEach((marker) => {
      const leadId = marker.id.replace(/^lead-/, '');
      const lead = leadRecords.find((entry) => entry.id === leadId);
      if (!lead) {
        return;
      }
      map.set(marker.id, {
        marker,
        kind: 'lead',
        lead,
      });
    });

    prospectMarkers.forEach((marker) => {
      const prospectId = marker.id.replace(/^prospect-/, '');
      const prospect = prospectCandidates.find((entry) => entry.id === prospectId);
      if (!prospect) {
        return;
      }
      map.set(marker.id, {
        marker,
        kind: 'prospect',
        prospect,
      });
    });

    customerMarkers.forEach((marker) => {
      const customerId = marker.id.replace(/^customer-/, '');
      const site = siteSummaries.find((entry) => entry.id === customerId);
      const client = clientRecords.find((entry) => entry.id === customerId);
      map.set(marker.id, {
        marker,
        kind: 'customer',
        customer: {
          id: customerId,
          name: client?.name || site?.name || customerId,
          address: client?.address || '',
          activeOrders: site?.activeOrderCount ?? 0,
          deliveredOrders: site?.deliveredOrderCount ?? 0,
        },
      });
    });

    deliveryMarkers.forEach((marker) => {
      const siteId = marker.id.replace(/^delivery-/, '');
      const snapshot = deliveryStatusBySite[siteId];
      if (!snapshot) {
        return;
      }
      map.set(marker.id, {
        marker,
        kind: 'delivery',
        delivery: {
          routeLabel: snapshot.routeLabel,
          status: snapshot.status,
          stopsAhead: snapshot.stopsAhead,
          truckName: snapshot.truckName,
        },
      });
    });

    return map;
  }, [leadMarkers, leadRecords, prospectMarkers, prospectCandidates, customerMarkers, siteSummaries, clientRecords, deliveryMarkers, deliveryStatusBySite]);

  useEffect(() => {
    if (mapMarkers.length === 0) {
      setSelectedMarkerId(undefined);
      return;
    }
    if (!selectedMarkerId || !mapMarkers.some((marker) => marker.id === selectedMarkerId)) {
      setSelectedMarkerId(mapMarkers[0].id);
    }
  }, [mapMarkers, selectedMarkerId]);

  const selectedMarker = selectedMarkerId ? markerDetails.get(selectedMarkerId) : undefined;

  const ensureProspectRecordId = (prospect: OpsProspectCandidate): string => {
    const existing = getOpsProspectRecord(prospect.id);
    if (existing) {
      return existing.id;
    }

    const created = saveOpsProspectRecord({
      id: prospect.id,
      name: prospect.name,
      owner: '',
      status: 'new',
      source: prospect.id.startsWith('poi-') ? 'seed' : 'map',
      googlePlaceId: prospect.id.startsWith('poi-') ? undefined : prospect.id,
      phone: prospect.phone,
      email: '',
      website: prospect.website,
      address: prospect.address,
      city: prospect.city,
      state: prospect.state,
      zip: prospect.zip,
      notes: prospect.description,
      lat: prospect.point.lat,
      lng: prospect.point.lng,
    });
    setProspectRecords(getOpsProspectRecords());
    return created.id;
  };

  const selectedEntity = useMemo<DrawerEntity | null>(() => {
    if (!selectedMarker) {
      return null;
    }

    if (selectedMarker.kind === 'lead' && selectedMarker.lead) {
      return {
        entityRef: { entityType: 'lead', entityId: selectedMarker.lead.id },
        name: selectedMarker.lead.name,
        statusLabel: selectedMarker.lead.stage,
        ownerLabel: selectedMarker.lead.owner || 'Unassigned',
        contactLine:
          selectedMarker.lead.phone || selectedMarker.lead.email
            ? [selectedMarker.lead.phone, selectedMarker.lead.email].filter(Boolean).join(' · ')
            : undefined,
        address: selectedMarker.lead.address || undefined,
      };
    }

    if (selectedMarker.kind === 'customer' && selectedMarker.customer) {
      return {
        entityRef: { entityType: 'client', entityId: selectedMarker.customer.id },
        name: selectedMarker.customer.name,
        statusLabel: 'client',
        contactLine: `${selectedMarker.customer.activeOrders} active · ${selectedMarker.customer.deliveredOrders} delivered`,
        address: selectedMarker.customer.address || undefined,
      };
    }

    if (selectedMarker.kind === 'prospect' && selectedMarker.prospect) {
      return {
        entityRef: { entityType: 'prospect', entityId: selectedMarker.prospect.id },
        name: selectedMarker.prospect.name,
        statusLabel: 'prospect',
        contactLine: selectedMarker.prospect.phone || undefined,
        address: selectedMarker.prospect.address || undefined,
      };
    }

    return null;
  }, [selectedMarker]);

  const entityTasks = selectedEntity ? getOpsCrmTasksForEntity(selectedEntity.entityRef) : [];
  const entityActivities = selectedEntity ? getOpsCrmActivitiesForEntity(selectedEntity.entityRef) : [];
  const entityVisits = selectedEntity ? getOpsCrmSalesVisitsForEntity(selectedEntity.entityRef) : [];
  const entitySampleOrders = selectedEntity ? getOpsCrmSampleOrdersForEntity(selectedEntity.entityRef) : [];

  const handleMarkerSelect = (markerId: string) => {
    setSelectedMarkerId(markerId);
    setEntityDrawerOpen(true);
  };

  const resolveActionEntityRef = (): OpsCrmEntityRef | null => {
    if (!selectedEntity) {
      return null;
    }
    if (selectedMarker?.kind === 'prospect' && selectedMarker.prospect) {
      const prospectId = ensureProspectRecordId(selectedMarker.prospect);
      return {
        entityType: 'prospect',
        entityId: prospectId,
      };
    }
    return selectedEntity.entityRef;
  };

  const handleViewRecord = () => {
    const entityRef = resolveActionEntityRef();
    if (!entityRef) {
      return;
    }
    navigate(`/ops/crm/records/${entityRef.entityType}/${entityRef.entityId}`);
  };

  const handleSaveTask = async () => {
    const entityRef = resolveActionEntityRef();
    if (!entityRef || !taskForm.title.trim() || !taskForm.dueAt) {
      return;
    }

    const savedTask = saveOpsCrmTaskRecord({
      title: taskForm.title,
      dueAt: new Date(taskForm.dueAt).toISOString(),
      urgent: taskForm.urgent,
      assignedUserId: taskForm.assignedUserId,
      status: taskForm.status,
      notes: taskForm.notes,
      entityRef,
    });

    await postOpsCalendarEvent({
      sourceRecordId: savedTask.id,
      siteId: entityRef.entityType === 'client' ? entityRef.entityId : undefined,
      title: `CRM Task: ${savedTask.title}`,
      description: savedTask.notes || undefined,
      type: 'task',
      status: taskStatusToCalendarStatus(savedTask.status),
      priority: savedTask.urgent ? 'high' : 'medium',
      startAt: savedTask.dueAt,
      links: {
        openPath: `/ops/crm/records/${entityRef.entityType}/${entityRef.entityId}`,
      },
      metadata: {
        origin: 'ops-crm-task',
        assignedUserId: savedTask.assignedUserId,
        entityType: entityRef.entityType,
        entityId: entityRef.entityId,
      },
    });

    setTaskDialogOpen(false);
    setTaskForm({
      title: '',
      dueAt: toDateTimeLocal(),
      urgent: false,
      assignedUserId: taskForm.assignedUserId,
      status: 'open',
      notes: '',
    });
  };

  const handleSaveActivity = () => {
    const entityRef = resolveActionEntityRef();
    if (!entityRef || !activityForm.type.trim() || !activityForm.note.trim() || !activityForm.at) {
      return;
    }

    saveOpsCrmActivityRecord({
      type: activityForm.type,
      at: new Date(activityForm.at).toISOString(),
      note: activityForm.note,
      actor: activityForm.actor,
      entityRef,
    });

    setActivityDialogOpen(false);
    setActivityForm((prev) => ({
      ...prev,
      at: toDateTimeLocal(),
      note: '',
    }));
  };

  const handleSaveVisit = async () => {
    const entityRef = resolveActionEntityRef();
    if (!entityRef || !visitForm.salesperson.trim() || !visitForm.date || !visitForm.startTime || !visitForm.duration.trim()) {
      return;
    }

    const savedVisit = saveOpsCrmSalesVisitRecord({
      salesperson: visitForm.salesperson,
      date: visitForm.date,
      startTime: visitForm.startTime,
      latestStartTime: visitForm.latestStartTime || undefined,
      duration: visitForm.duration,
      status: visitForm.status,
      notes: visitForm.notes,
      entityRef,
    });

    const startAt = toIsoFromDateAndTime(savedVisit.date, savedVisit.startTime);
    if (startAt) {
      const durationMinutes = parseDurationMinutes(savedVisit.duration);
      await postOpsCalendarEvent({
        sourceRecordId: savedVisit.id,
        siteId: entityRef.entityType === 'client' ? entityRef.entityId : undefined,
        title: `Sales Visit: ${selectedEntity?.name ?? entityRef.entityId}`,
        description: savedVisit.notes || `Salesperson: ${savedVisit.salesperson}`,
        type: 'schedule',
        status: visitStatusToCalendarStatus(savedVisit.status),
        priority: 'medium',
        startAt,
        endAt: durationMinutes ? addMinutesToIso(startAt, durationMinutes) : undefined,
        links: {
          openPath: `/ops/crm/records/${entityRef.entityType}/${entityRef.entityId}`,
        },
        metadata: {
          origin: 'ops-crm-sales-visit',
          salesperson: savedVisit.salesperson,
          duration: savedVisit.duration,
          latestStartTime: savedVisit.latestStartTime,
          entityType: entityRef.entityType,
          entityId: entityRef.entityId,
        },
      });
    }

    setVisitDialogOpen(false);
    setVisitForm((prev) => ({
      ...prev,
      date: toDateLocal(),
      startTime: '09:00',
      latestStartTime: '',
      duration: '1h',
      status: 'planned',
      notes: '',
    }));
  };

  const addSampleOrderItem = () => {
    if (!sampleOrderForm.productId) {
      return;
    }
    const product = productOptions.find((option) => option.id === sampleOrderForm.productId);
    if (!product) {
      return;
    }
    const quantity = Math.max(1, Math.floor(sampleOrderForm.quantity || 1));
    setSampleOrderForm((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const nextItems = [...prev.items];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + quantity,
        };
        return {
          ...prev,
          items: nextItems,
          quantity: 1,
        };
      }
      return {
        ...prev,
        items: [...prev.items, { productId: product.id, productName: product.name, quantity }],
        quantity: 1,
      };
    });
  };

  const removeSampleOrderItem = (productId: string) => {
    setSampleOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  };

  const handleSaveSampleOrder = async () => {
    const entityRef = resolveActionEntityRef();
    if (!entityRef || sampleOrderForm.items.length === 0) {
      return;
    }

    setSampleOrderSubmitting(true);
    setSampleOrderError(null);

    const savedRecord = saveOpsCrmSampleOrderRecord({
      status: sampleOrderForm.status,
      items: sampleOrderForm.items,
      notes: sampleOrderForm.notes,
      entityRef,
    });

    const opsOrderLineItems = sampleOrderForm.items.map((item) => ({
      product_id: item.productId,
      item_name: item.productName,
      qty: Math.max(1, Math.floor(item.quantity)),
      price: 0,
    }));

    const opsOrderStatus = sampleOrderStatusToOpsOrderStatus(sampleOrderForm.status);
    const customerName = selectedEntity?.name || `${entityRef.entityType}:${entityRef.entityId}`;
    const opsOrderNotes = [
      sampleOrderForm.notes.trim(),
      `CRM sample order: ${savedRecord.id}`,
      `CRM entity: ${entityRef.entityType}:${entityRef.entityId}`,
    ]
      .filter((entry) => entry.length > 0)
      .join('\n');

    try {
      await apiPost('/api/orders', {
        customer_name: customerName,
        order_date: toDateLocal(),
        status: opsOrderStatus,
        line_items: opsOrderLineItems,
        total: 0,
        notes: opsOrderNotes,
      }, {
        headers: createIdempotencyHeaders(`ops-orders-crm-sample-${savedRecord.id}`),
      });

      setSampleOrderDialogOpen(false);
      setSampleOrderForm({
        status: 'draft',
        notes: '',
        productId: sampleOrderForm.productId,
        quantity: 1,
        items: [],
      });
      navigate(`/ops/orders?customer=${encodeURIComponent(customerName)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create OPS sample order.';
      setSampleOrderError(message);
    } finally {
      setSampleOrderSubmitting(false);
    }
  };

  const openLeadDialogAtPoint = (point: GeoMapClickPoint, seed?: Partial<LeadFormState>) => {
    const seededPlaceId =
      (seed?.googlePlaceId && seed.googlePlaceId.trim().length > 0 ? seed.googlePlaceId : undefined) ??
      (typeof point.placeId === 'string' ? point.placeId : undefined);

    setLeadForm({
      ...defaultLeadForm(point),
      ...seed,
      googlePlaceId: seededPlaceId,
      lat: point.lat,
      lng: point.lng,
    });
    setPlaceImportMessage(null);
    setLeadDialogOpen(true);
  };

  const importPlaceDetailsIntoLeadForm = async () => {
    const placeId = leadForm.googlePlaceId?.trim();
    if (!placeId) {
      setPlaceImportMessage('Add a Google Place ID first.');
      return;
    }

    setPlaceImportPending(true);
    setPlaceImportMessage(null);

    try {
      const details = await fetchPlaceDetailsOnImport({
        placeId,
        explicitImportClick: true,
      });

      setLeadForm((prev) => {
        const nextAddress = details.formattedAddress || prev.address;
        const parsedAddress = parseAddressParts(nextAddress);
        const typeNote =
          details.types.length > 0 ? `Google types: ${details.types.join(', ')}` : '';
        const nextNotes =
          typeNote.length > 0 && !prev.notes.includes(typeNote)
            ? [prev.notes.trim(), typeNote].filter((entry) => entry.length > 0).join('\n')
            : prev.notes;

        return {
          ...prev,
          name: details.name || prev.name,
          phone: details.phone ?? prev.phone,
          website: details.website ?? prev.website,
          address: nextAddress || prev.address,
          city: parsedAddress.city ?? prev.city,
          state: parsedAddress.state ?? prev.state,
          zip: parsedAddress.zip ?? prev.zip,
          lat: details.location?.lat ?? prev.lat,
          lng: details.location?.lng ?? prev.lng,
          notes: nextNotes,
        };
      });

      setPlaceImportMessage(`Imported details for ${details.name}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import place details.';
      setPlaceImportMessage(message);
    } finally {
      setPlaceImportPending(false);
    }
  };

  const createLeadFromForm = () => {
    if (!leadForm.name.trim()) {
      globalThis.alert?.('Lead name is required.');
      return;
    }

    const duplicate = findOpsLeadDuplicate({
      id: leadForm.id,
      name: leadForm.name,
      address: leadForm.address,
      phone: leadForm.phone,
      googlePlaceId: leadForm.googlePlaceId,
    });

    if (duplicate && !leadForm.id) {
      globalThis.alert?.(
        `Duplicate lead detected: ${duplicate.name}. Open existing lead record instead.`
      );
      setLeadDialogOpen(false);
      setSelectedMarkerId(`lead-${duplicate.id}`);
      return;
    }

    const result = saveOpsLeadRecord({
      id: leadForm.id,
      name: leadForm.name,
      owner: leadForm.owner,
      stage: leadForm.stage,
      source: leadForm.source,
      googlePlaceId: leadForm.googlePlaceId?.trim() || undefined,
      phone: leadForm.phone,
      email: leadForm.email,
      website: leadForm.website,
      address: leadForm.address,
      city: leadForm.city,
      state: leadForm.state,
      zip: leadForm.zip,
      notes: leadForm.notes,
      lat: leadForm.lat,
      lng: leadForm.lng,
    });

    setLeadRecords(getOpsLeadRecords());
    setLeadDialogOpen(false);
    setSelectedMarkerId(`lead-${result.record.id}`);
  };

  const importProspectsToLeads = () => {
    if (prospectCandidates.length === 0) {
      globalThis.alert?.('No prospect markers available to import.');
      return;
    }

    let importedCount = 0;

    prospectCandidates.forEach((prospect) => {
      const result = saveOpsLeadRecord({
        name: prospect.name,
        owner: '',
        stage: 'prospect',
        source: 'map',
        googlePlaceId: prospect.id.startsWith('poi-') ? undefined : prospect.id,
        phone: prospect.phone,
        email: '',
        website: prospect.website,
        address: prospect.address,
        city: prospect.city,
        state: prospect.state,
        zip: prospect.zip,
        notes: prospect.description,
        lat: prospect.point.lat,
        lng: prospect.point.lng,
      });

      if (result.status === 'created') {
        importedCount += 1;
      }
    });

    setLeadRecords(getOpsLeadRecords());
    globalThis.alert?.(
      importedCount > 0
        ? `Imported ${importedCount} prospects into CRM leads.`
        : 'No new prospects imported (already present).'
    );
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS CRM" currentSuite="ops">
        <div className="flex h-96 items-center justify-center text-muted-foreground">Loading CRM workspace...</div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS CRM" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wholesale CRM</h1>
            <p className="mt-1 text-muted-foreground">Client records, lead generation, and delivery visibility.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
              <Users className="mr-1 h-3.5 w-3.5" />
              {summary.totalClients} Clients
            </Badge>
            <Badge className="border-violet-500/40 bg-violet-500/20 text-violet-100">
              {summary.leadCount} Leads
            </Badge>
            <Button asChild>
              <Link to="/ops/crm/clients">Open Client Directory</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-slate-900/60">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Link to="/ops/crm/clients?scope=clients" className="block">
                <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.totalClients}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/ops/crm/clients?scope=clients" className="block">
                <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.activeAccounts}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/ops/crm/clients?scope=leads" className="block">
                <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Leads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.leadCount}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/ops/logistics/routes" className="block">
                <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deliveries In Route</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{summary.activeDeliveries}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/ops/sales" className="block">
                <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Delivered Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${summary.deliveredValue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <Card style={panelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4" />
                  CRM Workspace
                </CardTitle>
                <CardDescription>
                  Use cards for account operations and map mode for lead discovery plus delivery visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/ops/crm/clients">Client Directory</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/ops/logistics/sites">Sites View</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/ops/orders">Orders</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/ops/logistics/routes">Route Planner</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card style={panelStyle}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Map Layers</CardTitle>
                <CardDescription>One engine for leads, customers, and delivery tracking.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <Switch id="layer-leads" checked={showLeads} onCheckedChange={setShowLeads} />
                  <Label htmlFor="layer-leads">Leads</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="layer-prospects" checked={showProspects} onCheckedChange={setShowProspects} />
                  <Label htmlFor="layer-prospects">Prospects</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="layer-customers" checked={showCustomers} onCheckedChange={setShowCustomers} />
                  <Label htmlFor="layer-customers">Customers</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="layer-deliveries" checked={showDeliveries} onCheckedChange={setShowDeliveries} />
                  <Label htmlFor="layer-deliveries">Deliveries</Label>
                </div>
                <Button
                  variant="outline"
                  onClick={() => openLeadDialogAtPoint({ lat: 38.58, lng: -121.49 }, { source: 'manual' })}
                >
                  Add Lead Manually
                </Button>
                <Button variant="outline" onClick={importProspectsToLeads}>
                  Import Prospects to Leads
                </Button>
              </CardContent>
              {import.meta.env.DEV && (
                <CardContent className="pt-0">
                  <div className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                    Google API usage (dev): map loads {googleApiUsage.mapScriptLoads} · place search{' '}
                    {googleApiUsage.placeSearchCalls} · place details {googleApiUsage.placeDetailsCalls}
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2" style={panelStyle}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapIcon className="h-4 w-4" />
                    CRM + Delivery Geo View
                  </CardTitle>
                  <CardDescription>Click map to drop a new lead pin.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Guardrail: marker rendering and map movement never call Places APIs. */}
                  <GeoMapSurface
                    markers={mapMarkers}
                    polylines={routePolylines}
                    selectedMarkerId={selectedMarkerId}
                    onMarkerSelect={handleMarkerSelect}
                    onMapClick={(point) => openLeadDialogAtPoint(point, { source: 'map' })}
                  />
                </CardContent>
              </Card>

              <Card style={panelStyle}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Selection Details</CardTitle>
                  <CardDescription>Card/tile detail behavior mapped to selected marker.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedMarker && (
                    <p className="text-sm text-muted-foreground">Select a marker to inspect or create a lead.</p>
                  )}

                  {selectedMarker?.kind === 'lead' && selectedMarker.lead && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold">{selectedMarker.lead.name}</p>
                        <Badge className={stageBadgeClass(selectedMarker.lead.stage)}>
                          {selectedMarker.lead.stage}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Owner: {selectedMarker.lead.owner || 'Unassigned'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMarker.lead.phone || 'No phone'} {selectedMarker.lead.email ? `· ${selectedMarker.lead.email}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedMarker.lead.address || 'No address set'}</p>
                    </div>
                  )}

                  {selectedMarker?.kind === 'prospect' && selectedMarker.prospect && (
                    <div className="space-y-3">
                      <p className="text-base font-semibold">{selectedMarker.prospect.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMarker.prospect.address}, {selectedMarker.prospect.city}, {selectedMarker.prospect.state}{' '}
                        {selectedMarker.prospect.zip}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedMarker.prospect.phone || 'No phone listed'}</p>
                      <p className="text-sm text-muted-foreground">{selectedMarker.prospect.description}</p>
                      <Button
                        onClick={() =>
                          openLeadDialogAtPoint(selectedMarker.prospect!.point, {
                            name: selectedMarker.prospect!.name,
                            address: selectedMarker.prospect!.address,
                            city: selectedMarker.prospect!.city,
                            state: selectedMarker.prospect!.state,
                            zip: selectedMarker.prospect!.zip,
                            phone: selectedMarker.prospect!.phone,
                            website: selectedMarker.prospect!.website,
                            notes: selectedMarker.prospect!.description,
                            source: 'map',
                            googlePlaceId: selectedMarker.prospect!.id,
                          })
                        }
                      >
                        Create Lead From Prospect
                      </Button>
                    </div>
                  )}

                  {selectedMarker?.kind === 'customer' && selectedMarker.customer && (
                    <div className="space-y-3">
                      <p className="text-base font-semibold">{selectedMarker.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMarker.customer.address || 'Address not set'}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border border-border/60 bg-background/20 p-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Orders</p>
                          <p className="text-lg font-semibold">{selectedMarker.customer.activeOrders}</p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-background/20 p-2">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivered</p>
                          <p className="text-lg font-semibold">{selectedMarker.customer.deliveredOrders}</p>
                        </div>
                      </div>
                      <Button variant="outline" asChild>
                        <Link to={`/ops/crm/clients/${selectedMarker.customer.id}`}>Open Client Profile</Link>
                      </Button>
                    </div>
                  )}

                  {selectedMarker?.kind === 'delivery' && selectedMarker.delivery && (
                    <div className="space-y-3">
                      <p className="text-base font-semibold">{selectedMarker.marker.title}</p>
                      <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
                        {selectedMarker.delivery.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Route: {selectedMarker.delivery.routeLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stops ahead: {selectedMarker.delivery.stopsAhead}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Truck: {selectedMarker.delivery.truckName || 'Unassigned'}
                      </p>
                      <Button variant="outline" asChild>
                        <Link to="/ops/logistics/routes" className="gap-1">
                          <Route className="h-4 w-4" />
                          Open Route Planner
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Sheet open={entityDrawerOpen} onOpenChange={setEntityDrawerOpen}>
              <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Entity Snapshot</SheetTitle>
                  <SheetDescription>
                    Quick action workspace for the selected lead, client, or prospect.
                  </SheetDescription>
                </SheetHeader>
                {!selectedEntity ? (
                  <div className="mt-4 text-sm text-muted-foreground">Select a map marker to open entity actions.</div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-md border border-border/60 bg-background/20 p-3">
                      <p className="text-base font-semibold">{selectedEntity.name}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {selectedEntity.entityRef.entityType} · {selectedEntity.statusLabel}
                      </p>
                      {selectedEntity.ownerLabel && (
                        <p className="mt-2 text-sm text-muted-foreground">Owner: {selectedEntity.ownerLabel}</p>
                      )}
                      {selectedEntity.contactLine && (
                        <p className="text-sm text-muted-foreground">{selectedEntity.contactLine}</p>
                      )}
                      {selectedEntity.address && (
                        <p className="text-sm text-muted-foreground">{selectedEntity.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleViewRecord}>View Record</Button>
                      <Button variant="outline" onClick={() => setTaskDialogOpen(true)}>
                        <ClipboardList className="mr-1 h-4 w-4" />
                        Add Task
                      </Button>
                      <Button variant="outline" onClick={() => setActivityDialogOpen(true)}>
                        <FileText className="mr-1 h-4 w-4" />
                        Log Activity
                      </Button>
                      <Button variant="outline" onClick={() => setVisitDialogOpen(true)}>
                        Schedule Visit
                      </Button>
                      <Button variant="outline" className="col-span-2" onClick={() => setSampleOrderDialogOpen(true)}>
                        <FlaskConical className="mr-1 h-4 w-4" />
                        Sample Order
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-border/60 bg-background/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Open Tasks</p>
                        <p className="text-lg font-semibold">
                          {entityTasks.filter((task) => task.status === 'open').length}
                        </p>
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Activities</p>
                        <p className="text-lg font-semibold">{entityActivities.length}</p>
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sales Visits</p>
                        <p className="text-lg font-semibold">{entityVisits.length}</p>
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sample Orders</p>
                        <p className="text-lg font-semibold">{entitySampleOrders.length}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent Activity</p>
                      {entityActivities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="rounded-md border border-border/60 bg-background/20 p-2 text-xs">
                          <p className="font-medium">{activity.type}</p>
                          <p className="text-muted-foreground">
                            {new Date(activity.at).toLocaleString()} · {activity.actor || 'Unknown'}
                          </p>
                          <p className="line-clamp-2 text-muted-foreground">{activity.note}</p>
                        </div>
                      ))}
                      {entityActivities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No activity logged yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </TabsContent>
        </Tabs>

        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
              <DialogDescription>Create a CRM task linked to the selected entity.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Follow up on draft proposal"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="task-due-at">Due date</Label>
                  <Input
                    id="task-due-at"
                    type="datetime-local"
                    value={taskForm.dueAt}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="task-assigned">Assigned user</Label>
                  <Input
                    id="task-assigned"
                    value={taskForm.assignedUserId}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, assignedUserId: event.target.value }))
                    }
                    placeholder="Travis Partlow"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={taskForm.status}
                    onValueChange={(value: OpsCrmTaskStatus) =>
                      setTaskForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    id="task-urgent"
                    checked={taskForm.urgent}
                    onCheckedChange={(value) => setTaskForm((prev) => ({ ...prev, urgent: value }))}
                  />
                  <Label htmlFor="task-urgent">Urgent task</Label>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="task-notes">Notes</Label>
                <Textarea
                  id="task-notes"
                  rows={3}
                  value={taskForm.notes}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTask}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
              <DialogDescription>Track calls, emails, visits, and notes for the selected entity.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Activity type</Label>
                  <Select
                    value={activityForm.type}
                    onValueChange={(value) => setActivityForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="visit">Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="activity-at">Date and time</Label>
                  <Input
                    id="activity-at"
                    type="datetime-local"
                    value={activityForm.at}
                    onChange={(event) => setActivityForm((prev) => ({ ...prev, at: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="activity-actor">Actor</Label>
                <Input
                  id="activity-actor"
                  value={activityForm.actor}
                  onChange={(event) => setActivityForm((prev) => ({ ...prev, actor: event.target.value }))}
                  placeholder="Travis Partlow"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="activity-note">Note</Label>
                <Textarea
                  id="activity-note"
                  rows={4}
                  value={activityForm.note}
                  onChange={(event) => setActivityForm((prev) => ({ ...prev, note: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveActivity}>Log Activity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Schedule Sales Visit</DialogTitle>
              <DialogDescription>Plan a visit for the selected CRM entity.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="visit-salesperson">Sales person</Label>
                  <Input
                    id="visit-salesperson"
                    value={visitForm.salesperson}
                    onChange={(event) => setVisitForm((prev) => ({ ...prev, salesperson: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="visit-date">Date</Label>
                  <Input
                    id="visit-date"
                    type="date"
                    value={visitForm.date}
                    onChange={(event) => setVisitForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="visit-start">Start time</Label>
                  <Input
                    id="visit-start"
                    type="time"
                    value={visitForm.startTime}
                    onChange={(event) => setVisitForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="visit-latest">Latest start time (optional)</Label>
                  <Input
                    id="visit-latest"
                    type="time"
                    value={visitForm.latestStartTime}
                    onChange={(event) =>
                      setVisitForm((prev) => ({ ...prev, latestStartTime: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="visit-duration">Duration</Label>
                  <Input
                    id="visit-duration"
                    value={visitForm.duration}
                    onChange={(event) => setVisitForm((prev) => ({ ...prev, duration: event.target.value }))}
                    placeholder="1h 30m"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={visitForm.status}
                    onValueChange={(value: OpsCrmVisitStatus) =>
                      setVisitForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="visit-notes">Notes</Label>
                <Textarea
                  id="visit-notes"
                  rows={3}
                  value={visitForm.notes}
                  onChange={(event) => setVisitForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVisit}>Save Visit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={sampleOrderDialogOpen}
          onOpenChange={(nextOpen) => {
            setSampleOrderDialogOpen(nextOpen);
            if (!nextOpen) {
              setSampleOrderError(null);
            }
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Sample Order</DialogTitle>
              <DialogDescription>
                Build a free sample order linked to the selected CRM entity and create an OPS order record.
              </DialogDescription>
            </DialogHeader>
            {sampleOrderError && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {sampleOrderError}
              </div>
            )}
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Select
                  value={sampleOrderForm.productId}
                  onValueChange={(value) => setSampleOrderForm((prev) => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={sampleOrderForm.quantity}
                  onChange={(event) =>
                    setSampleOrderForm((prev) => ({ ...prev, quantity: Number(event.target.value) || 1 }))
                  }
                  className="w-24"
                />
                <Button type="button" variant="outline" onClick={addSampleOrderItem}>
                  Add Item
                </Button>
              </div>
              {productOptions.length === 0 && (
                <p className="text-xs text-amber-300">
                  No products loaded from inventory yet. Add products in OPS inventory first.
                </p>
              )}
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Items</p>
                <div className="space-y-2">
                  {sampleOrderForm.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSampleOrderItem(item.productId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {sampleOrderForm.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">No items added yet.</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={sampleOrderForm.status}
                  onValueChange={(value: OpsCrmSampleOrderStatus) =>
                    setSampleOrderForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sample-order-notes">Notes</Label>
                <Textarea
                  id="sample-order-notes"
                  rows={3}
                  value={sampleOrderForm.notes}
                  onChange={(event) =>
                    setSampleOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSampleOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveSampleOrder()}
                disabled={sampleOrderForm.items.length === 0 || sampleOrderSubmitting}
              >
                {sampleOrderSubmitting ? 'Saving...' : 'Save Sample Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create CRM Lead</DialogTitle>
              <DialogDescription>
                Confirm lead details from map pin or manual entry before saving into OPS CRM.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-name">Lead Name</Label>
                  <Input
                    id="lead-name"
                    value={leadForm.name}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Business name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-owner">Sales Owner</Label>
                  <Input
                    id="lead-owner"
                    value={leadForm.owner}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, owner: event.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Stage</Label>
                  <Select
                    value={leadForm.stage}
                    onValueChange={(value: OpsLeadStage) => setLeadForm((prev) => ({ ...prev, stage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-gplace">Google Place ID (optional)</Label>
                  <Input
                    id="lead-gplace"
                    value={leadForm.googlePlaceId || ''}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, googlePlaceId: event.target.value }))}
                    placeholder="place_id"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void importPlaceDetailsIntoLeadForm()}
                      disabled={placeImportPending || !leadForm.googlePlaceId?.trim()}
                    >
                      {placeImportPending ? 'Importing…' : 'Import Place Details'}
                    </Button>
                    {placeImportMessage && (
                      <p
                        className={`text-xs ${
                          placeImportMessage.startsWith('Imported ')
                            ? 'text-emerald-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {placeImportMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input
                    id="lead-phone"
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="(555) 555-1234"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    value={leadForm.email}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="orders@client.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-website">Website</Label>
                <Input
                  id="lead-website"
                  value={leadForm.website}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-address">Address</Label>
                <Input
                  id="lead-address"
                  value={leadForm.address}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, address: event.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-city">City</Label>
                  <Input
                    id="lead-city"
                    value={leadForm.city}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-state">State</Label>
                  <Input
                    id="lead-state"
                    value={leadForm.state}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, state: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-zip">ZIP</Label>
                  <Input
                    id="lead-zip"
                    value={leadForm.zip}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, zip: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-lat">Latitude</Label>
                  <Input
                    id="lead-lat"
                    type="number"
                    value={leadForm.lat}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, lat: Number(event.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-lng">Longitude</Label>
                  <Input
                    id="lead-lng"
                    type="number"
                    value={leadForm.lng}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, lng: Number(event.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea
                  id="lead-notes"
                  rows={3}
                  value={leadForm.notes}
                  onChange={(event) => setLeadForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createLeadFromForm}>Save Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Route Context In CRM</CardTitle>
            <CardDescription>Shared status model from logistics powers account delivery context.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-background/20 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracked Routes</p>
              <p className="text-2xl font-semibold">{routeSummaries.length}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/20 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Trucks</p>
              <p className="inline-flex items-center gap-1 text-2xl font-semibold">
                <Truck className="h-4 w-4" />
                {truckAssignments.filter((assignment) => assignment.routeCount > 0).length}
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/20 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sites In Delivery Flow</p>
              <p className="text-2xl font-semibold">{Object.keys(deliveryStatusBySite).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
