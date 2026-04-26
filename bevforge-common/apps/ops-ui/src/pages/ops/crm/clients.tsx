import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  defaultOpsTaxProfile,
  formatOpsCertificateStatus,
  formatOpsSalesChannel,
  formatOpsTaxTreatment,
  isOpsCertificateExpired,
  resolveOpsCertificateStatus,
  type OpsTaxProfileSnapshot,
} from '@/lib/ops-tax';
import { Building2, MapPinned, Plus, Search, UserRound, Users } from 'lucide-react';
import { dedupeProspects, getSeedProspectCandidates } from '../geo/map-data';
import { buildSiteSummaries, fetchLogisticsOrders, getSiteProfile, type LogisticsOrder } from '../logistics/data';
import {
  getOpsClientRecords,
  getOpsLeadRecords,
  getOpsProspectRecords,
  loadOpsCrmState,
  saveOpsClientRecord,
  saveOpsProspectRecord,
  type OpsClientRecord,
  type OpsClientStatus,
  type OpsLeadRecord,
  type OpsProspectRecord,
  type OpsProspectStatus,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

interface ClientFormState {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  googlePlaceId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  status: OpsClientStatus;
  notes: string;
}

interface ClientView {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: OpsClientStatus;
  orderCount: number;
  activeOrderCount: number;
  deliveredOrderCount: number;
  deliveredValue: number;
  taxProfile: OpsTaxProfileSnapshot;
}

type DirectoryFilter = 'all' | 'clients' | 'leads' | 'prospects';
type ComplianceFilter = 'all' | 'missing' | 'review' | 'expiring' | 'compliant';

interface LeadView {
  id: string;
  name: string;
  owner: string;
  stage: string;
  email: string;
  phone: string;
  address: string;
  updatedAt: string;
}

interface ProspectView {
  id: string;
  name: string;
  owner: string;
  status: OpsProspectStatus;
  source: OpsProspectRecord['source'];
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
  updatedAt: string;
  persisted: boolean;
}

const defaultForm = (): ClientFormState => ({
  id: '',
  name: '',
  contactName: '',
  phone: '',
  email: '',
  googlePlaceId: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  lat: 0,
  lng: 0,
  status: 'active',
  notes: '',
});

const isDirectoryFilter = (value: string | null): value is DirectoryFilter =>
  value === 'all' || value === 'clients' || value === 'leads' || value === 'prospects';

const isComplianceFilter = (value: string | null): value is ComplianceFilter =>
  value === 'all' ||
  value === 'missing' ||
  value === 'review' ||
  value === 'expiring' ||
  value === 'compliant';

const normalizeText = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const prospectStatusClass = (status: OpsProspectStatus): string => {
  switch (status) {
    case 'researching':
      return 'border-blue-500/40 bg-blue-500/20 text-blue-200';
    case 'attempted_contact':
      return 'border-amber-500/40 bg-amber-500/20 text-amber-200';
    case 'ready_for_lead':
      return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200';
    case 'disqualified':
      return 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300';
    default:
      return 'border-violet-500/40 bg-violet-500/20 text-violet-100';
  }
};

export default function OpsCrmClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ClientFormState>(defaultForm);
  const [directoryFilter, setDirectoryFilter] = useState<DirectoryFilter>(() => {
    const initialScope = searchParams.get('scope');
    return isDirectoryFilter(initialScope) ? initialScope : 'all';
  });
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>(() => {
    const initialValue = searchParams.get('compliance');
    return isComplianceFilter(initialValue) ? initialValue : 'all';
  });

  const [clientRecords, setClientRecords] = useState<OpsClientRecord[]>([]);
  const [leadRecords, setLeadRecords] = useState<OpsLeadRecord[]>([]);
  const [prospectRecords, setProspectRecords] = useState<OpsProspectRecord[]>([]);

  const refreshRecords = () => {
    setClientRecords(getOpsClientRecords());
    setLeadRecords(getOpsLeadRecords());
    setProspectRecords(getOpsProspectRecords());
  };

  useEffect(() => {
    let active = true;

    (async () => {
      await loadOpsCrmState();
      const nextOrders = await fetchLogisticsOrders();
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      refreshRecords();
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const scope = searchParams.get('scope');
    const next = isDirectoryFilter(scope) ? scope : 'all';
    setDirectoryFilter(next);
    const nextCompliance = searchParams.get('compliance');
    setComplianceFilter(isComplianceFilter(nextCompliance) ? nextCompliance : 'all');
  }, [searchParams]);

  const applyDirectoryFilter = (next: DirectoryFilter) => {
    setDirectoryFilter(next);
    const nextParams = new globalThis.URLSearchParams(searchParams);
    if (next === 'all') {
      nextParams.delete('scope');
    } else {
      nextParams.set('scope', next);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const applyComplianceFilter = (next: ComplianceFilter) => {
    setComplianceFilter(next);
    const nextParams = new globalThis.URLSearchParams(searchParams);
    if (next === 'all') {
      nextParams.delete('compliance');
    } else {
      nextParams.set('compliance', next);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const clients = useMemo<ClientView[]>(() => {
    const siteSummaries = buildSiteSummaries(orders);
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
          name: local?.name || site?.name || profile.siteName || id,
          contactName: local?.contactName || profile.contactName || '',
          email: local?.email || profile.email || '',
          phone: local?.phone || profile.phone || '',
          address:
            local?.address ||
            profile.address ||
            [local?.city, local?.state, local?.zip].filter(Boolean).join(', '),
          status: local?.status || 'active',
          orderCount: site?.orderCount ?? 0,
          activeOrderCount: site?.activeOrderCount ?? 0,
          deliveredOrderCount: site?.deliveredOrderCount ?? 0,
          deliveredValue,
          taxProfile: local?.taxProfile ?? defaultOpsTaxProfile(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, clientRecords]);

  const complianceCounts = useMemo(() => {
    return clients.reduce(
      (acc, client) => {
        const status = resolveOpsCertificateStatus(client.taxProfile);
        const isWholesaleResale =
          client.taxProfile.salesChannel === 'wholesale' ||
          client.taxProfile.taxTreatment === 'resale_exempt';
        const expiringSoon =
          Boolean(client.taxProfile.resaleCertificateExpiresAt) &&
          !isOpsCertificateExpired(client.taxProfile.resaleCertificateExpiresAt) &&
          (() => {
            const expiresAt = new Date(
              `${client.taxProfile.resaleCertificateExpiresAt}T23:59:59.999`
            ).valueOf();
            const now = Date.now();
            return Number.isFinite(expiresAt) && expiresAt <= now + 45 * 24 * 60 * 60 * 1000;
          })();

        acc.all += 1;
        if (status === 'verified') {
          acc.compliant += 1;
        }
        if (status === 'uploaded_unverified') {
          acc.review += 1;
        }
        if (expiringSoon) {
          acc.expiring += 1;
        }
        if (isWholesaleResale && status !== 'verified') {
          acc.missing += 1;
        }
        return acc;
      },
      { all: 0, missing: 0, review: 0, expiring: 0, compliant: 0 }
    );
  }, [clients]);

  const leads = useMemo<LeadView[]>(() => {
    return leadRecords.map((lead) => ({
      id: lead.id,
      name: lead.name,
      owner: lead.owner,
      stage: lead.stage,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      updatedAt: lead.updatedAt,
    }));
  }, [leadRecords]);

  const prospects = useMemo<ProspectView[]>(() => {
    const seedProspects = dedupeProspects(getSeedProspectCandidates(), leadRecords, clientRecords).map(
      (seed) =>
        ({
          id: seed.id,
          name: seed.name,
          owner: '',
          status: 'new' as OpsProspectStatus,
          source: 'seed' as const,
          email: '',
          phone: seed.phone,
          website: seed.website,
          address: seed.address,
          city: seed.city,
          state: seed.state,
          zip: seed.zip,
          notes: seed.description,
          lat: seed.point.lat,
          lng: seed.point.lng,
          googlePlaceId: seed.id.startsWith('poi-') ? undefined : seed.id,
          updatedAt: new Date().toISOString(),
          persisted: false,
        }) satisfies ProspectView
    );

    const leadKeySet = new Set(leadRecords.map((lead) => `${normalizeText(lead.name)}|${normalizeText(lead.address)}`));
    const clientKeySet = new Set(clientRecords.map((client) => `${normalizeText(client.name)}|${normalizeText(client.address)}`));

    const persistedProspects = prospectRecords
      .filter((prospect) => {
        const key = `${normalizeText(prospect.name)}|${normalizeText(prospect.address)}`;
        return !leadKeySet.has(key) && !clientKeySet.has(key);
      })
      .map(
        (prospect) =>
          ({
            ...prospect,
            persisted: true,
          }) satisfies ProspectView
      );

    const merged = new Map<string, ProspectView>();
    persistedProspects.forEach((prospect) => merged.set(prospect.id, prospect));

    seedProspects.forEach((prospect) => {
      const duplicate = Array.from(merged.values()).find((existing) => {
        return (
          normalizeText(existing.name) === normalizeText(prospect.name) &&
          normalizeText(existing.address) === normalizeText(prospect.address)
        );
      });
      if (!duplicate) {
        merged.set(prospect.id, prospect);
      }
    });

    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [leadRecords, clientRecords, prospectRecords]);

  const filtered = useMemo(() => {
    const pool = (() => {
      if (directoryFilter === 'clients') {
        return { clients, leads: [] as LeadView[], prospects: [] as ProspectView[] };
      }
      if (directoryFilter === 'leads') {
        return { clients: [] as ClientView[], leads, prospects: [] as ProspectView[] };
      }
      if (directoryFilter === 'prospects') {
        return { clients: [] as ClientView[], leads: [] as LeadView[], prospects };
      }
      return { clients, leads, prospects };
    })();

    const filteredClients =
      complianceFilter === 'all'
        ? pool.clients
        : pool.clients.filter((client) => {
            const status = resolveOpsCertificateStatus(client.taxProfile);
            const isWholesaleResale =
              client.taxProfile.salesChannel === 'wholesale' ||
              client.taxProfile.taxTreatment === 'resale_exempt';
            const expiringSoon =
              Boolean(client.taxProfile.resaleCertificateExpiresAt) &&
              !isOpsCertificateExpired(client.taxProfile.resaleCertificateExpiresAt) &&
              (() => {
                const expiresAt = new Date(
                  `${client.taxProfile.resaleCertificateExpiresAt}T23:59:59.999`
                ).valueOf();
                const now = Date.now();
                return Number.isFinite(expiresAt) && expiresAt <= now + 45 * 24 * 60 * 60 * 1000;
              })();

            switch (complianceFilter) {
              case 'missing':
                return isWholesaleResale && status !== 'verified';
              case 'review':
                return status === 'uploaded_unverified';
              case 'expiring':
                return expiringSoon;
              case 'compliant':
                return status === 'verified';
              default:
                return true;
            }
          });

    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return { ...pool, clients: filteredClients };
    }

    return {
      clients: filteredClients.filter((client) => {
        return (
          client.name.toLowerCase().includes(normalized) ||
          client.id.toLowerCase().includes(normalized) ||
          client.contactName.toLowerCase().includes(normalized) ||
          client.email.toLowerCase().includes(normalized)
        );
      }),
      leads: pool.leads.filter((lead) => {
        return (
          lead.name.toLowerCase().includes(normalized) ||
          lead.id.toLowerCase().includes(normalized) ||
          lead.owner.toLowerCase().includes(normalized) ||
          lead.email.toLowerCase().includes(normalized)
        );
      }),
      prospects: pool.prospects.filter((prospect) => {
        return (
          prospect.name.toLowerCase().includes(normalized) ||
          prospect.id.toLowerCase().includes(normalized) ||
          prospect.owner.toLowerCase().includes(normalized) ||
          prospect.email.toLowerCase().includes(normalized) ||
          prospect.status.toLowerCase().includes(normalized)
        );
      }),
    };
  }, [clients, leads, prospects, directoryFilter, complianceFilter, query]);

  const createClient = () => {
    if (!form.name.trim()) {
      globalThis.alert?.('Client name is required.');
      return;
    }

    saveOpsClientRecord({
      id: form.id.trim() || undefined,
      name: form.name,
      contactName: form.contactName,
      phone: form.phone,
      email: form.email,
      googlePlaceId: form.googlePlaceId,
      address: [form.address, [form.city, form.state, form.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      city: form.city,
      state: form.state,
      zip: form.zip,
      lat: form.lat,
      lng: form.lng,
      status: form.status,
      taxProfile: defaultOpsTaxProfile(),
      notes: form.notes,
    });

    refreshRecords();
    setCreateOpen(false);
    setForm(defaultForm());
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS CRM Clients" currentSuite="ops">
        <div className="flex h-96 items-center justify-center text-muted-foreground">Loading CRM directory...</div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS CRM Clients" currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CRM Directory</h1>
            <p className="mt-1 text-muted-foreground">Manage clients, leads, and prospects in one workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-cyan-500/40 bg-cyan-500/20 text-cyan-100">
              <Users className="mr-1 h-3.5 w-3.5" />
              {clients.length} Clients
            </Badge>
            <Badge className="border-violet-500/40 bg-violet-500/20 text-violet-100">{leads.length} Leads</Badge>
            <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-100">{prospects.length} Prospects</Badge>
            <Button variant="outline" asChild>
              <Link to="/ops/crm">CRM Home</Link>
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Client</DialogTitle>
                  <DialogDescription>Create a CRM client account for OPS.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-id">Client ID (optional)</Label>
                      <Input
                        id="client-id"
                        value={form.id}
                        onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                        placeholder="site-joes-pub"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-name">Client Name</Label>
                      <Input
                        id="client-name"
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Joe's Pub"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-contact">Contact</Label>
                      <Input
                        id="client-contact"
                        value={form.contactName}
                        onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                        placeholder="Joe Miller"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value: OpsClientStatus) => setForm((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger id="client-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-place-id">Google Place ID (optional)</Label>
                      <Input
                        id="client-place-id"
                        value={form.googlePlaceId}
                        onChange={(event) => setForm((prev) => ({ ...prev, googlePlaceId: event.target.value }))}
                        placeholder="places/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-phone">Phone</Label>
                      <Input
                        id="client-phone"
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="(555) 555-1111"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="orders@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-lat">Latitude</Label>
                      <Input
                        id="client-lat"
                        type="number"
                        value={form.lat}
                        onChange={(event) => setForm((prev) => ({ ...prev, lat: Number(event.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-lng">Longitude</Label>
                      <Input
                        id="client-lng"
                        type="number"
                        value={form.lng}
                        onChange={(event) => setForm((prev) => ({ ...prev, lng: Number(event.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="client-address">Address</Label>
                    <Input
                      id="client-address"
                      value={form.address}
                      onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-city">City</Label>
                      <Input
                        id="client-city"
                        value={form.city}
                        onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-state">State</Label>
                      <Input
                        id="client-state"
                        value={form.state}
                        onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="client-zip">ZIP</Label>
                      <Input
                        id="client-zip"
                        value={form.zip}
                        onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="client-notes">Notes</Label>
                    <Textarea
                      id="client-notes"
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createClient}>Save Client</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card style={panelStyle}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Find Clients / Leads / Prospects</CardTitle>
            <CardDescription>Search by name, id, owner/contact, email, or status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={directoryFilter === 'all' ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-100' : ''}
                onClick={() => applyDirectoryFilter('all')}
              >
                {clients.length + leads.length + prospects.length} All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={directoryFilter === 'clients' ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-100' : ''}
                onClick={() => applyDirectoryFilter('clients')}
              >
                {clients.length} Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={directoryFilter === 'leads' ? 'border-violet-500/40 bg-violet-500/20 text-violet-100' : ''}
                onClick={() => applyDirectoryFilter('leads')}
              >
                {leads.length} Leads
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={directoryFilter === 'prospects' ? 'border-amber-500/40 bg-amber-500/20 text-amber-100' : ''}
                onClick={() => applyDirectoryFilter('prospects')}
              >
                {prospects.length} Prospects
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={complianceFilter === 'all' ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-100' : ''}
                onClick={() => applyComplianceFilter('all')}
              >
                {complianceCounts.all} All Clients
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={complianceFilter === 'missing' ? 'border-red-500/40 bg-red-500/20 text-red-100' : ''}
                onClick={() => applyComplianceFilter('missing')}
              >
                {complianceCounts.missing} Missing Cert
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={complianceFilter === 'review' ? 'border-amber-500/40 bg-amber-500/20 text-amber-100' : ''}
                onClick={() => applyComplianceFilter('review')}
              >
                {complianceCounts.review} Needs Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={complianceFilter === 'expiring' ? 'border-orange-500/40 bg-orange-500/20 text-orange-100' : ''}
                onClick={() => applyComplianceFilter('expiring')}
              >
                {complianceCounts.expiring} Expiring Soon
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={complianceFilter === 'compliant' ? 'border-green-500/40 bg-green-500/20 text-green-100' : ''}
                onClick={() => applyComplianceFilter('compliant')}
              >
                {complianceCounts.compliant} Compliant
              </Button>
            </div>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clients, leads, or prospects"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.clients.map((client) => (
            <Link key={client.id} to={`/ops/crm/records/client/${client.id}`} className="block">
              <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-4 w-4" />
                        {client.name}
                      </CardTitle>
                      <CardDescription>{client.id}</CardDescription>
                    </div>
                    <Badge
                      className={
                        client.status === 'inactive'
                          ? 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300'
                          : client.activeOrderCount > 0
                            ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                            : 'border-green-500/40 bg-green-500/20 text-green-300'
                      }
                    >
                      {client.status === 'inactive' ? 'Inactive' : client.activeOrderCount > 0 ? 'Active Queue' : 'Stable'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{formatOpsSalesChannel(client.taxProfile.salesChannel)}</Badge>
                    <Badge variant="outline">{formatOpsTaxTreatment(client.taxProfile.taxTreatment)}</Badge>
                    <Badge
                      className={
                        resolveOpsCertificateStatus(client.taxProfile) === 'verified'
                          ? 'border-green-500/40 bg-green-500/20 text-green-200'
                          : resolveOpsCertificateStatus(client.taxProfile) === 'uploaded_unverified'
                            ? 'border-amber-500/40 bg-amber-500/20 text-amber-200'
                            : resolveOpsCertificateStatus(client.taxProfile) === 'expired'
                              ? 'border-red-500/40 bg-red-500/20 text-red-200'
                              : 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300'
                      }
                    >
                      {formatOpsCertificateStatus(resolveOpsCertificateStatus(client.taxProfile))}
                    </Badge>
                    {client.taxProfile.resaleCertificateNumber && (
                      <Badge variant="outline">Cert: {client.taxProfile.resaleCertificateNumber}</Badge>
                    )}
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
                    <p className="text-lg font-semibold">{client.orderCount}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivered Sales</p>
                    <p className="text-lg font-semibold">${client.deliveredValue.toFixed(2)}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                    <p className="truncate text-sm font-medium">{client.contactName || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">{client.email || 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filtered.leads.map((lead) => (
            <Link key={lead.id} to={`/ops/crm/records/lead/${lead.id}`} className="block">
              <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPinned className="h-4 w-4" />
                        {lead.name}
                      </CardTitle>
                      <CardDescription>{lead.id}</CardDescription>
                    </div>
                    <Badge className="border-violet-500/40 bg-violet-500/20 text-violet-200">{lead.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
                    <p className="truncate text-sm font-medium">{lead.owner || 'Unassigned'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">{lead.email || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="truncate text-sm font-medium">{lead.phone || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Updated</p>
                    <p className="truncate text-sm font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2 rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                    <p className="truncate text-sm font-medium">{lead.address || 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filtered.prospects.map((prospect) => (
            <Link
              key={prospect.id}
              to={`/ops/crm/records/prospect/${prospect.id}`}
              className="block"
              onClick={() => {
                if (!prospect.persisted) {
                  saveOpsProspectRecord({
                    id: prospect.id,
                    name: prospect.name,
                    owner: prospect.owner,
                    status: prospect.status,
                    source: prospect.source,
                    googlePlaceId: prospect.googlePlaceId,
                    phone: prospect.phone,
                    email: prospect.email,
                    website: prospect.website,
                    address: prospect.address,
                    city: prospect.city,
                    state: prospect.state,
                    zip: prospect.zip,
                    notes: prospect.notes,
                    lat: prospect.lat,
                    lng: prospect.lng,
                  });
                }
              }}
            >
              <Card style={panelStyle} className="h-full cursor-pointer transition-colors hover:bg-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <UserRound className="h-4 w-4" />
                        {prospect.name}
                      </CardTitle>
                      <CardDescription>{prospect.persisted ? prospect.id : `${prospect.id} (seed)`}</CardDescription>
                    </div>
                    <Badge className={prospectStatusClass(prospect.status)}>{prospect.status.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
                    <p className="truncate text-sm font-medium">{prospect.owner || 'Unassigned'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Source</p>
                    <p className="truncate text-sm font-medium">{prospect.source}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="truncate text-sm font-medium">{prospect.phone || 'Not set'}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Updated</p>
                    <p className="truncate text-sm font-medium">{new Date(prospect.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2 rounded-md border border-border/60 bg-background/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                    <p className="truncate text-sm font-medium">
                      {[prospect.address, prospect.city, prospect.state, prospect.zip].filter(Boolean).join(', ') || 'Not set'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
