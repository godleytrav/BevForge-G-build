import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPost } from '@/lib/api';
import {
  buildOpsTaxProfileSnapshot,
  formatOpsCertificateStatus,
  formatOpsTaxTreatment,
  resolveOpsCertificateStatus,
  type OpsClientAccountType,
  type OpsCertificateStatus,
  type OpsClientSalesChannel,
  type OpsClientTaxTreatment,
} from '@/lib/ops-tax';
import { ArrowLeft, Building2, Camera, FileUp, Mail, MapPin, Phone, Printer, ShieldCheck, ExternalLink } from 'lucide-react';
import { buildSiteSummaries, fetchLogisticsOrders, getSiteProfile, saveSiteProfile, type LogisticsOrder } from '../logistics/data';
import {
  getOpsClientRecord,
  getOpsClientRecords,
  getOpsLeadRecord,
  getOpsProspectRecord,
  loadOpsCrmState,
  saveOpsProspectRecord,
  deleteOpsProspectRecord,
  deleteOpsLeadRecord,
  saveOpsClientRecord,
  saveOpsLeadRecord,
  type OpsClientStatus,
  type OpsLeadStage,
  type OpsProspectStatus,
} from './data';

const panelStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
} as const;

interface ClientFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  googlePlaceId?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  status: OpsClientStatus;
  salesChannel: OpsClientSalesChannel;
  accountType: OpsClientAccountType;
  taxTreatment: OpsClientTaxTreatment;
  salesTaxRate: number;
  certificateStatus: OpsCertificateStatus;
  resaleCertificateNumber: string;
  resaleCertificateState: string;
  resaleCertificateExpiresAt: string;
  certificateFileName: string;
  certificateCapturedAt: string;
  certificateVerifiedAt: string;
  certificateVerifiedBy: string;
  sellerPermitNumber: string;
  taxNote: string;
  notes: string;
}

interface ClientCertificateFile {
  id: string;
  clientId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  contentUrl: string;
}

interface LeadFormState {
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
  lat: number;
  lng: number;
  source: 'manual' | 'map';
  googlePlaceId?: string;
}

interface ProspectFormState {
  name: string;
  owner: string;
  status: OpsProspectStatus;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lat: number;
  lng: number;
  source: 'seed' | 'map' | 'manual';
  googlePlaceId?: string;
}

type RecordType = 'client' | 'lead' | 'prospect';

const isRecordType = (value: string | undefined): value is RecordType => {
  return value === 'client' || value === 'lead' || value === 'prospect';
};

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const toSiteIdFromName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? `site-${slug}` : '';
};

export default function OpsCrmRecordDetailPage() {
  const navigate = useNavigate();
  const { recordType, recordId } = useParams();
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState<ClientFormState | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormState | null>(null);
  const [prospectForm, setProspectForm] = useState<ProspectFormState | null>(null);
  const [certificateFile, setCertificateFile] = useState<ClientCertificateFile | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const certificateUploadInputRef = useRef<HTMLInputElement | null>(null);
  const certificateCameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      await loadOpsCrmState();
      const nextOrders = await fetchLogisticsOrders();
      if (!active) {
        return;
      }
      setOrders(nextOrders);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const normalizedType = isRecordType(recordType) ? recordType : null;
  const normalizedId = recordId ?? null;

  const clientRecord = useMemo(() => {
    if (!normalizedType || !normalizedId || normalizedType !== 'client') {
      return null;
    }

    const site = buildSiteSummaries(orders).find((candidate) => candidate.id === normalizedId) ?? null;
    const localRecord = getOpsClientRecord(normalizedId);

    if (!site && !localRecord) {
      return null;
    }

    const displayName = localRecord?.name || site?.name || normalizedId;
    const profile = getSiteProfile(normalizedId, displayName);
    const normalizedIdText = normalizeText(normalizedId);
    const normalizedDisplayName = normalizeText(displayName);

    const matchedOrders = orders.filter((order) => {
      const orderCustomerId = normalizeText(order.customerId || '');
      const fallbackCustomerId = normalizeText(toSiteIdFromName(order.customerName || ''));
      const normalizedOrderName = normalizeText(order.customerName || '');

      if (orderCustomerId && orderCustomerId === normalizedIdText) {
        return true;
      }
      if (fallbackCustomerId && fallbackCustomerId === normalizedIdText) {
        return true;
      }
      return normalizedDisplayName.length > 0 && normalizedOrderName === normalizedDisplayName;
    });

    const orderCount = matchedOrders.length;
    const activeOrderCount = matchedOrders.filter((order) =>
      ['draft', 'confirmed', 'approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(order.status)
    ).length;
    const deliveredOrders = matchedOrders.filter((order) => order.status === 'delivered');
    const deliveredOrderCount = deliveredOrders.length;
    const deliveredValue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      id: normalizedId,
      name: displayName,
      status: localRecord?.status ?? 'active',
      orderCount,
      activeOrderCount,
      deliveredOrderCount,
      deliveredValue,
      orders: matchedOrders,
      profile,
      localRecord,
    };
  }, [normalizedType, normalizedId, orders]);

  const leadRecord = useMemo(() => {
    if (!normalizedType || !normalizedId || normalizedType !== 'lead') {
      return null;
    }
    return getOpsLeadRecord(normalizedId);
  }, [normalizedType, normalizedId]);

  const prospectRecord = useMemo(() => {
    if (!normalizedType || !normalizedId || normalizedType !== 'prospect') {
      return null;
    }
    return getOpsProspectRecord(normalizedId);
  }, [normalizedType, normalizedId]);

  useEffect(() => {
    if (!clientRecord) {
      return;
    }

    setClientForm({
      name: clientRecord.name,
      contactName: clientRecord.localRecord?.contactName || clientRecord.profile.contactName || '',
      phone: clientRecord.localRecord?.phone || clientRecord.profile.phone || '',
      email: clientRecord.localRecord?.email || clientRecord.profile.email || '',
      googlePlaceId: clientRecord.localRecord?.googlePlaceId,
      address: clientRecord.localRecord?.address || clientRecord.profile.address || '',
      city: clientRecord.localRecord?.city || '',
      state: clientRecord.localRecord?.state || '',
      zip: clientRecord.localRecord?.zip || '',
      lat: clientRecord.localRecord?.lat ?? 0,
      lng: clientRecord.localRecord?.lng ?? 0,
      status: clientRecord.localRecord?.status || 'active',
      salesChannel: clientRecord.localRecord?.taxProfile.salesChannel || 'retail',
      accountType: clientRecord.localRecord?.taxProfile.accountType || 'other',
      taxTreatment: clientRecord.localRecord?.taxProfile.taxTreatment || 'taxable',
      salesTaxRate: (clientRecord.localRecord?.taxProfile.salesTaxRate ?? 0.09) * 100,
      certificateStatus: clientRecord.localRecord?.taxProfile.certificateStatus || 'missing',
      resaleCertificateNumber: clientRecord.localRecord?.taxProfile.resaleCertificateNumber || '',
      resaleCertificateState: clientRecord.localRecord?.taxProfile.resaleCertificateState || '',
      resaleCertificateExpiresAt: clientRecord.localRecord?.taxProfile.resaleCertificateExpiresAt || '',
      certificateFileName: clientRecord.localRecord?.taxProfile.certificateFileName || '',
      certificateCapturedAt: clientRecord.localRecord?.taxProfile.certificateCapturedAt || '',
      certificateVerifiedAt: clientRecord.localRecord?.taxProfile.certificateVerifiedAt || '',
      certificateVerifiedBy: clientRecord.localRecord?.taxProfile.certificateVerifiedBy || '',
      sellerPermitNumber: clientRecord.localRecord?.taxProfile.sellerPermitNumber || '',
      taxNote: clientRecord.localRecord?.taxProfile.taxNote || '',
      notes: clientRecord.localRecord?.notes || '',
    });
  }, [clientRecord]);

  useEffect(() => {
    if (!leadRecord) {
      return;
    }

    setLeadForm({
      name: leadRecord.name,
      owner: leadRecord.owner,
      stage: leadRecord.stage,
      phone: leadRecord.phone,
      email: leadRecord.email,
      website: leadRecord.website,
      address: leadRecord.address,
      city: leadRecord.city,
      state: leadRecord.state,
      zip: leadRecord.zip,
      notes: leadRecord.notes,
      lat: leadRecord.lat,
      lng: leadRecord.lng,
      source: leadRecord.source,
      googlePlaceId: leadRecord.googlePlaceId,
    });
  }, [leadRecord]);

  useEffect(() => {
    if (!prospectRecord) {
      return;
    }

    setProspectForm({
      name: prospectRecord.name,
      owner: prospectRecord.owner,
      status: prospectRecord.status,
      phone: prospectRecord.phone,
      email: prospectRecord.email,
      website: prospectRecord.website,
      address: prospectRecord.address,
      city: prospectRecord.city,
      state: prospectRecord.state,
      zip: prospectRecord.zip,
      notes: prospectRecord.notes,
      lat: prospectRecord.lat,
      lng: prospectRecord.lng,
      source: prospectRecord.source,
      googlePlaceId: prospectRecord.googlePlaceId,
    });
  }, [prospectRecord]);

  useEffect(() => {
    if (!clientRecord) {
      setCertificateFile(null);
      setCertificateError(null);
      return;
    }

    let active = true;
    setCertificateLoading(true);
    setCertificateError(null);

    apiGet<ClientCertificateFile>(`/api/ops/crm/certificates/${encodeURIComponent(clientRecord.id)}`)
      .then((result) => {
        if (!active) {
          return;
        }
        setCertificateFile(result);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setCertificateFile(null);
      })
      .finally(() => {
        if (active) {
          setCertificateLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clientRecord]);

  const loadCertificateFile = async (clientId: string): Promise<void> => {
    try {
      setCertificateLoading(true);
      setCertificateError(null);
      const result = await apiGet<ClientCertificateFile>(
        `/api/ops/crm/certificates/${encodeURIComponent(clientId)}`
      );
      setCertificateFile(result);
    } catch (error) {
      setCertificateFile(null);
      setCertificateError(error instanceof Error ? error.message : 'Certificate file not found.');
    } finally {
      setCertificateLoading(false);
    }
  };

  const persistClientForm = (nextForm: ClientFormState) => {
    if (!clientRecord || !nextForm.name.trim()) {
      return;
    }
    saveOpsClientRecord({
      id: clientRecord.id,
      name: nextForm.name,
      contactName: nextForm.contactName,
      phone: nextForm.phone,
      email: nextForm.email,
      googlePlaceId: nextForm.googlePlaceId,
      address: nextForm.address,
      city: nextForm.city,
      state: nextForm.state,
      zip: nextForm.zip,
      lat: nextForm.lat,
      lng: nextForm.lng,
      status: nextForm.status,
      taxProfile: buildOpsTaxProfileSnapshot({
        salesChannel: nextForm.salesChannel,
        accountType: nextForm.accountType,
        taxTreatment: nextForm.taxTreatment,
        salesTaxRate: nextForm.salesTaxRate / 100,
        certificateStatus: nextForm.certificateStatus,
        resaleCertificateNumber: nextForm.resaleCertificateNumber,
        resaleCertificateState: nextForm.resaleCertificateState,
        resaleCertificateExpiresAt: nextForm.resaleCertificateExpiresAt,
        certificateFileName: nextForm.certificateFileName,
        certificateCapturedAt: nextForm.certificateCapturedAt,
        certificateVerifiedAt: nextForm.certificateVerifiedAt,
        certificateVerifiedBy: nextForm.certificateVerifiedBy,
        sellerPermitNumber: nextForm.sellerPermitNumber,
        taxNote: nextForm.taxNote,
      }),
      notes: nextForm.notes,
    });

    saveSiteProfile({
      siteId: clientRecord.id,
      siteName: nextForm.name,
      contactName: nextForm.contactName,
      phone: nextForm.phone,
      email: nextForm.email,
      address: nextForm.address,
      deliveryWindow: clientRecord.profile.deliveryWindow,
      receivingHours: clientRecord.profile.receivingHours,
      dockNotes: clientRecord.profile.dockNotes,
    });

    setSavedAt(new Date().toISOString());
  };

  const saveClient = () => {
    if (!clientForm) {
      return;
    }
    persistClientForm(clientForm);
  };

  const markCertificateStatus = (status: OpsCertificateStatus) => {
    setClientForm((prev) => {
      if (!prev) {
        return prev;
      }
      const now = new Date().toISOString();
      const nextForm = {
        ...prev,
        certificateStatus: status,
        certificateVerifiedAt: status === 'verified' ? now : status === 'uploaded_unverified' ? '' : prev.certificateVerifiedAt,
        certificateVerifiedBy: status === 'verified' ? 'ops-operator' : status === 'uploaded_unverified' ? '' : prev.certificateVerifiedBy,
      };
      persistClientForm(nextForm);
      return nextForm;
    });
  };

  const uploadCertificateFile = async (file: globalThis.File) => {
    if (!clientRecord || !clientForm) {
      return;
    }

    setCertificateUploading(true);
    setCertificateError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new globalThis.FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
            return;
          }
          reject(new Error('Failed to read certificate file.'));
        };
        reader.onerror = () => reject(new Error('Failed to read certificate file.'));
        reader.readAsDataURL(file);
      });

      const result = await apiPost<ClientCertificateFile>('/api/ops/crm/certificates', {
        clientId: clientRecord.id,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
      });
      await loadCertificateFile(clientRecord.id);
      setClientForm((prev) => {
        if (!prev) {
          return prev;
        }
        const nextForm = {
          ...prev,
          certificateStatus: 'uploaded_unverified' as OpsCertificateStatus,
          certificateFileName: result.fileName,
          certificateCapturedAt: result.updatedAt,
          certificateVerifiedAt: '',
          certificateVerifiedBy: '',
        };
        persistClientForm(nextForm);
        return nextForm;
      });
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : 'Failed to upload certificate file.');
    } finally {
      setCertificateUploading(false);
      if (certificateUploadInputRef.current) {
        certificateUploadInputRef.current.value = '';
      }
      if (certificateCameraInputRef.current) {
        certificateCameraInputRef.current.value = '';
      }
    }
  };

  const openCertificate = () => {
    if (!certificateFile) {
      return;
    }
    globalThis.open(certificateFile.contentUrl, '_blank', 'noopener,noreferrer');
  };

  const printCertificate = () => {
    if (!certificateFile) {
      return;
    }
    const printWindow = globalThis.open(certificateFile.contentUrl, '_blank', 'noopener,noreferrer');
    if (printWindow) {
      printWindow.addEventListener(
        'load',
        () => {
          printWindow.print();
        },
        { once: true }
      );
    }
  };

  const effectiveCertificateStatus = clientForm
    ? resolveOpsCertificateStatus(clientForm)
    : ('missing' as OpsCertificateStatus);

  const saveLead = () => {
    if (!leadRecord || !leadForm || !leadForm.name.trim()) {
      return;
    }

    saveOpsLeadRecord({
      id: leadRecord.id,
      name: leadForm.name,
      owner: leadForm.owner,
      stage: leadForm.stage,
      source: leadForm.source,
      googlePlaceId: leadForm.googlePlaceId,
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

    if (leadForm.stage === 'converted') {
      const normalizedName = leadForm.name.trim().toLowerCase();
      const normalizedAddress = leadForm.address.trim().toLowerCase();
      const existingClient = getOpsClientRecords().find((client) => {
        if (
          leadForm.googlePlaceId &&
          client.googlePlaceId &&
          client.googlePlaceId === leadForm.googlePlaceId
        ) {
          return true;
        }

        return (
          client.name.trim().toLowerCase() === normalizedName &&
          client.address.trim().toLowerCase() === normalizedAddress &&
          normalizedName.length > 0
        );
      });

      saveOpsClientRecord({
        id: existingClient?.id,
        name: leadForm.name,
        contactName: leadForm.owner,
        phone: leadForm.phone,
        email: leadForm.email,
        googlePlaceId: leadForm.googlePlaceId,
        address: leadForm.address,
        city: leadForm.city,
        state: leadForm.state,
        zip: leadForm.zip,
        lat: leadForm.lat,
        lng: leadForm.lng,
        status: 'active',
        taxProfile: buildOpsTaxProfileSnapshot(existingClient?.taxProfile),
        notes: leadForm.notes,
      });

      const siteId = existingClient?.id || `site-${leadForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
      const existingProfile = getSiteProfile(siteId, leadForm.name);
      saveSiteProfile({
        siteId,
        siteName: leadForm.name,
        contactName: existingProfile.contactName || leadForm.owner || '',
        phone: existingProfile.phone || leadForm.phone || '',
        email: existingProfile.email || leadForm.email || '',
        address: existingProfile.address || leadForm.address || '',
        deliveryWindow: existingProfile.deliveryWindow || '',
        receivingHours: existingProfile.receivingHours || '',
        dockNotes: existingProfile.dockNotes || '',
      });
    }

    setSavedAt(new Date().toISOString());
  };

  const moveLeadToProspects = () => {
    if (!leadRecord || !leadForm) {
      return;
    }

    saveOpsProspectRecord({
      name: leadForm.name,
      owner: leadForm.owner,
      status: 'ready_for_lead',
      source: leadForm.source === 'manual' ? 'manual' : 'map',
      googlePlaceId: leadForm.googlePlaceId,
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
      lastTouchAt: new Date().toISOString(),
    });

    deleteOpsLeadRecord(leadRecord.id);
    navigate('/ops/crm/clients');
  };

  const saveProspect = () => {
    if (!prospectRecord || !prospectForm || !prospectForm.name.trim()) {
      return;
    }

    saveOpsProspectRecord({
      id: prospectRecord.id,
      name: prospectForm.name,
      owner: prospectForm.owner,
      status: prospectForm.status,
      source: prospectForm.source,
      googlePlaceId: prospectForm.googlePlaceId,
      phone: prospectForm.phone,
      email: prospectForm.email,
      website: prospectForm.website,
      address: prospectForm.address,
      city: prospectForm.city,
      state: prospectForm.state,
      zip: prospectForm.zip,
      notes: prospectForm.notes,
      lat: prospectForm.lat,
      lng: prospectForm.lng,
      lastTouchAt: new Date().toISOString(),
    });

    setSavedAt(new Date().toISOString());
  };

  const promoteProspectToLead = () => {
    if (!prospectRecord || !prospectForm || !prospectForm.name.trim()) {
      return;
    }

    const result = saveOpsLeadRecord({
      name: prospectForm.name,
      owner: prospectForm.owner,
      stage: 'prospect',
      source: prospectForm.source === 'seed' ? 'map' : prospectForm.source,
      googlePlaceId: prospectForm.googlePlaceId,
      phone: prospectForm.phone,
      email: prospectForm.email,
      website: prospectForm.website,
      address: prospectForm.address,
      city: prospectForm.city,
      state: prospectForm.state,
      zip: prospectForm.zip,
      notes: prospectForm.notes,
      lat: prospectForm.lat,
      lng: prospectForm.lng,
    });

    deleteOpsProspectRecord(prospectRecord.id);
    if (result.status === 'duplicate') {
      navigate('/ops/crm/clients');
      return;
    }
    navigate(`/ops/crm/records/lead/${result.record.id}`);
  };

  if (loading) {
    return (
      <AppShell pageTitle="OPS CRM Record" currentSuite="ops">
        <div className="flex h-96 items-center justify-center text-muted-foreground">Loading CRM record...</div>
      </AppShell>
    );
  }

  if (
    !normalizedType ||
    !normalizedId ||
    (normalizedType === 'client' && !clientRecord) ||
    (normalizedType === 'lead' && !leadRecord) ||
    (normalizedType === 'prospect' && !prospectRecord)
  ) {
    return (
      <AppShell pageTitle="OPS CRM Record" currentSuite="ops">
        <div className="space-y-6">
          <Button variant="outline" asChild>
            <Link to="/ops/crm/clients" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Directory
            </Link>
          </Button>
          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle>Record Not Found</CardTitle>
              <CardDescription>The selected record is not available in OPS CRM.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (normalizedType === 'lead' && leadRecord && leadForm) {
    return (
      <AppShell pageTitle={`OPS CRM — ${leadForm.name}`} currentSuite="ops">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Button variant="outline" asChild>
                <Link to="/ops/crm/clients" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Directory
                </Link>
              </Button>
              <h1 className="mt-3 text-3xl font-bold text-foreground">{leadForm.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{leadRecord.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className="border-violet-500/40 bg-violet-500/20 text-violet-200">
                {leadForm.stage}
              </Badge>
            </div>
          </div>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Lead Profile
              </CardTitle>
              <CardDescription>Lead details and stage tracking in one editor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="lead-name">Lead Name</Label>
                  <Input
                    id="lead-name"
                    value={leadForm.name}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-owner">Sales Owner</Label>
                  <Input
                    id="lead-owner"
                    value={leadForm.owner}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, owner: event.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stage</Label>
                  <Select
                    value={leadForm.stage}
                    onValueChange={(value: OpsLeadStage) =>
                      setLeadForm((prev) => (prev ? { ...prev, stage: value } : prev))
                    }
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
                  <Label htmlFor="lead-source">Source</Label>
                  <Input id="lead-source" value={leadForm.source} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input
                    id="lead-phone"
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    value={leadForm.email}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-website">Website</Label>
                <Input
                  id="lead-website"
                  value={leadForm.website}
                  onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, website: event.target.value } : prev))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-address">Address</Label>
                <Input
                  id="lead-address"
                  value={leadForm.address}
                  onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, address: event.target.value } : prev))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="lead-city">City</Label>
                  <Input
                    id="lead-city"
                    value={leadForm.city}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-state">State</Label>
                  <Input
                    id="lead-state"
                    value={leadForm.state}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, state: event.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-zip">ZIP</Label>
                  <Input
                    id="lead-zip"
                    value={leadForm.zip}
                    onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, zip: event.target.value } : prev))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-google-place">Google Place ID</Label>
                <Input
                  id="lead-google-place"
                  value={leadForm.googlePlaceId ?? ''}
                  onChange={(event) =>
                    setLeadForm((prev) =>
                      prev ? { ...prev, googlePlaceId: event.target.value || undefined } : prev
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="lead-lat">Latitude</Label>
                  <Input
                    id="lead-lat"
                    type="number"
                    value={leadForm.lat}
                    onChange={(event) =>
                      setLeadForm((prev) => (prev ? { ...prev, lat: Number(event.target.value) || 0 } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lead-lng">Longitude</Label>
                  <Input
                    id="lead-lng"
                    type="number"
                    value={leadForm.lng}
                    onChange={(event) =>
                      setLeadForm((prev) => (prev ? { ...prev, lng: Number(event.target.value) || 0 } : prev))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea
                  id="lead-notes"
                  value={leadForm.notes}
                  onChange={(event) => setLeadForm((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border/60 bg-background/20 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="inline-flex items-center gap-1 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {leadForm.phone || 'Not set'}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/20 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="inline-flex items-center gap-1 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5" />
                    {leadForm.email || 'Not set'}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/20 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                  <p className="inline-flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    {leadForm.address || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : 'Unsaved changes'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={moveLeadToProspects}>
                    Move To Prospects
                  </Button>
                  <Button onClick={saveLead}>Save Lead</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (normalizedType === 'prospect' && prospectRecord && prospectForm) {
    return (
      <AppShell pageTitle={`OPS CRM — ${prospectForm.name}`} currentSuite="ops">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Button variant="outline" asChild>
                <Link to="/ops/crm/clients" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Directory
                </Link>
              </Button>
              <h1 className="mt-3 text-3xl font-bold text-foreground">{prospectForm.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{prospectRecord.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-100">
                {prospectForm.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Card style={panelStyle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Prospect Profile
              </CardTitle>
              <CardDescription>Qualify and manage prospect details before promoting to lead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="prospect-name">Prospect Name</Label>
                  <Input
                    id="prospect-name"
                    value={prospectForm.name}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-owner">Owner</Label>
                  <Input
                    id="prospect-owner"
                    value={prospectForm.owner}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, owner: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={prospectForm.status}
                    onValueChange={(value: OpsProspectStatus) =>
                      setProspectForm((prev) => (prev ? { ...prev, status: value } : prev))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="researching">Researching</SelectItem>
                      <SelectItem value="attempted_contact">Attempted Contact</SelectItem>
                      <SelectItem value="ready_for_lead">Ready For Lead</SelectItem>
                      <SelectItem value="disqualified">Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-source">Source</Label>
                  <Input id="prospect-source" value={prospectForm.source} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-phone">Phone</Label>
                  <Input
                    id="prospect-phone"
                    value={prospectForm.phone}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-email">Email</Label>
                  <Input
                    id="prospect-email"
                    value={prospectForm.email}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="prospect-website">Website</Label>
                <Input
                  id="prospect-website"
                  value={prospectForm.website}
                  onChange={(event) =>
                    setProspectForm((prev) => (prev ? { ...prev, website: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prospect-address">Address</Label>
                <Input
                  id="prospect-address"
                  value={prospectForm.address}
                  onChange={(event) =>
                    setProspectForm((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="prospect-city">City</Label>
                  <Input
                    id="prospect-city"
                    value={prospectForm.city}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, city: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-state">State</Label>
                  <Input
                    id="prospect-state"
                    value={prospectForm.state}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, state: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-zip">ZIP</Label>
                  <Input
                    id="prospect-zip"
                    value={prospectForm.zip}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, zip: event.target.value } : prev))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="prospect-google-place">Google Place ID</Label>
                <Input
                  id="prospect-google-place"
                  value={prospectForm.googlePlaceId ?? ''}
                  onChange={(event) =>
                    setProspectForm((prev) =>
                      prev ? { ...prev, googlePlaceId: event.target.value || undefined } : prev
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="prospect-lat">Latitude</Label>
                  <Input
                    id="prospect-lat"
                    type="number"
                    value={prospectForm.lat}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, lat: Number(event.target.value) || 0 } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prospect-lng">Longitude</Label>
                  <Input
                    id="prospect-lng"
                    type="number"
                    value={prospectForm.lng}
                    onChange={(event) =>
                      setProspectForm((prev) => (prev ? { ...prev, lng: Number(event.target.value) || 0 } : prev))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prospect-notes">Notes</Label>
                <Textarea
                  id="prospect-notes"
                  rows={3}
                  value={prospectForm.notes}
                  onChange={(event) =>
                    setProspectForm((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : 'Unsaved changes'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveProspect}>
                    Save Prospect
                  </Button>
                  <Button onClick={promoteProspectToLead} disabled={prospectForm.status === 'disqualified'}>
                    Promote To Lead
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!clientRecord || !clientForm) {
    return null;
  }

  return (
    <AppShell pageTitle={`OPS CRM — ${clientForm.name}`} currentSuite="ops">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button variant="outline" asChild>
              <Link to="/ops/crm/clients" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Link>
            </Button>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{clientForm.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{clientRecord.id}</p>
          </div>
          <div className="flex gap-2">
            <Badge
              className={
                clientForm.status === 'inactive'
                  ? 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300'
                  : 'border-green-500/40 bg-green-500/20 text-green-300'
              }
            >
              {clientForm.status === 'inactive' ? 'Inactive' : 'Active'}
            </Badge>
            <Button variant="outline" asChild>
              <Link to={`/ops/logistics/sites/${clientRecord.id}`}>Open Logistics View</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/ops/orders?customerId=${encodeURIComponent(clientRecord.id)}`}>
                View Client Orders
              </Link>
            </Button>
            <Button asChild>
              <Link
                to={`/ops/orders?customer=${encodeURIComponent(clientForm.name)}&customerId=${encodeURIComponent(clientRecord.id)}`}
              >
                Create Order
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clientRecord.orderCount}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clientRecord.activeOrderCount}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clientRecord.deliveredOrderCount}</p>
            </CardContent>
          </Card>
          <Card style={panelStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivered Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${clientRecord.deliveredValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-4 w-4" />
              Client Profile
            </CardTitle>
            <CardDescription>Contact and account details for this client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  value={clientForm.name}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-contact">Contact</Label>
                <Input
                  id="client-contact"
                  value={clientForm.contactName}
                  onChange={(event) =>
                    setClientForm((prev) => (prev ? { ...prev, contactName: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-status">Status</Label>
                <Select
                  value={clientForm.status}
                  onValueChange={(value: OpsClientStatus) =>
                    setClientForm((prev) => (prev ? { ...prev, status: value } : prev))
                  }
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
              <div className="space-y-1">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  value={clientForm.phone}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  value={clientForm.email}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-google-place">Google Place ID</Label>
                <Input
                  id="client-google-place"
                  value={clientForm.googlePlaceId ?? ''}
                  onChange={(event) =>
                    setClientForm((prev) =>
                      prev ? { ...prev, googlePlaceId: event.target.value || undefined } : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="client-address">Address</Label>
              <Input
                id="client-address"
                value={clientForm.address}
                onChange={(event) => setClientForm((prev) => (prev ? { ...prev, address: event.target.value } : prev))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="client-city">City</Label>
                <Input
                  id="client-city"
                  value={clientForm.city}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-state">State</Label>
                <Input
                  id="client-state"
                  value={clientForm.state}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, state: event.target.value } : prev))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-zip">ZIP</Label>
                <Input
                  id="client-zip"
                  value={clientForm.zip}
                  onChange={(event) => setClientForm((prev) => (prev ? { ...prev, zip: event.target.value } : prev))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client-lat">Latitude</Label>
                <Input
                  id="client-lat"
                  type="number"
                  value={clientForm.lat}
                  onChange={(event) =>
                    setClientForm((prev) => (prev ? { ...prev, lat: Number(event.target.value) || 0 } : prev))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client-lng">Longitude</Label>
                <Input
                  id="client-lng"
                  type="number"
                  value={clientForm.lng}
                  onChange={(event) =>
                    setClientForm((prev) => (prev ? { ...prev, lng: Number(event.target.value) || 0 } : prev))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="client-notes">Notes</Label>
              <Textarea
                id="client-notes"
                value={clientForm.notes}
                onChange={(event) => setClientForm((prev) => (prev ? { ...prev, notes: event.target.value } : prev))}
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">Tax & Permit Profile</p>
                <p className="text-xs text-muted-foreground">
                  Store resale certificate, sales channel, and seller permit details for wholesale and retail reporting.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="client-sales-channel">Sales Channel</Label>
                  <Select
                    value={clientForm.salesChannel}
                    onValueChange={(value: OpsClientSalesChannel) =>
                      setClientForm((prev) => (prev ? { ...prev, salesChannel: value } : prev))
                    }
                  >
                    <SelectTrigger id="client-sales-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client-account-type">Account Type</Label>
                  <Select
                    value={clientForm.accountType}
                    onValueChange={(value: OpsClientAccountType) =>
                      setClientForm((prev) => (prev ? { ...prev, accountType: value } : prev))
                    }
                  >
                    <SelectTrigger id="client-account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="retail_shop">Retail Shop</SelectItem>
                      <SelectItem value="club">Club</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client-tax-treatment">Tax Treatment</Label>
                  <Select
                    value={clientForm.taxTreatment}
                    onValueChange={(value: OpsClientTaxTreatment) =>
                      setClientForm((prev) => (prev ? { ...prev, taxTreatment: value } : prev))
                    }
                  >
                    <SelectTrigger id="client-tax-treatment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taxable">Taxable</SelectItem>
                      <SelectItem value="resale_exempt">Resale Exempt</SelectItem>
                      <SelectItem value="non_revenue">Internal / Non-Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="client-sales-tax-rate">Sales Tax Rate (%)</Label>
                  <Input
                    id="client-sales-tax-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={clientForm.salesTaxRate}
                    onChange={(event) =>
                      setClientForm((prev) =>
                        prev ? { ...prev, salesTaxRate: Number(event.target.value) || 0 } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client-resale-number">Resale Certificate #</Label>
                  <Input
                    id="client-resale-number"
                    value={clientForm.resaleCertificateNumber}
                    onChange={(event) =>
                      setClientForm((prev) =>
                        prev ? { ...prev, resaleCertificateNumber: event.target.value } : prev
                      )
                    }
                    placeholder="RESALE-12345"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client-resale-state">Certificate State</Label>
                  <Input
                    id="client-resale-state"
                    value={clientForm.resaleCertificateState}
                    onChange={(event) =>
                      setClientForm((prev) =>
                        prev ? { ...prev, resaleCertificateState: event.target.value } : prev
                      )
                    }
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="client-resale-expiry">Certificate Expiration</Label>
                  <Input
                    id="client-resale-expiry"
                    type="date"
                    value={clientForm.resaleCertificateExpiresAt}
                    onChange={(event) =>
                      setClientForm((prev) =>
                        prev ? { ...prev, resaleCertificateExpiresAt: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="client-seller-permit">Seller Permit #</Label>
                  <Input
                    id="client-seller-permit"
                    value={clientForm.sellerPermitNumber}
                    onChange={(event) =>
                      setClientForm((prev) =>
                        prev ? { ...prev, sellerPermitNumber: event.target.value } : prev
                      )
                    }
                    placeholder="Permit or account number"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <Label htmlFor="client-tax-note">Tax Notes</Label>
                <Textarea
                  id="client-tax-note"
                  rows={2}
                  value={clientForm.taxNote}
                  onChange={(event) =>
                    setClientForm((prev) => (prev ? { ...prev, taxNote: event.target.value } : prev))
                  }
                  placeholder="Special filing notes, exemption notes, or accountant guidance."
                />
              </div>

              <div className="mt-4 rounded-lg border border-border/60 bg-background/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Resale Certificate Vault</p>
                    <p className="text-xs text-muted-foreground">
                      Store the actual certificate on file for fast audit retrieval and wholesale order enforcement.
                    </p>
                  </div>
                  <Badge
                    className={
                      effectiveCertificateStatus === 'verified'
                        ? 'border-green-500/40 bg-green-500/20 text-green-200'
                        : effectiveCertificateStatus === 'uploaded_unverified'
                          ? 'border-amber-500/40 bg-amber-500/20 text-amber-200'
                          : effectiveCertificateStatus === 'expired'
                            ? 'border-red-500/40 bg-red-500/20 text-red-200'
                            : 'border-zinc-500/40 bg-zinc-500/20 text-zinc-300'
                    }
                  >
                    {formatOpsCertificateStatus(effectiveCertificateStatus)}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border/60 bg-background/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">File</p>
                    <p className="mt-1 text-sm font-medium">
                      {clientForm.certificateFileName || certificateFile?.fileName || 'No file uploaded'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Captured</p>
                    <p className="mt-1 text-sm font-medium">
                      {clientForm.certificateCapturedAt
                        ? new Date(clientForm.certificateCapturedAt).toLocaleString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified</p>
                    <p className="mt-1 text-sm font-medium">
                      {clientForm.certificateVerifiedAt
                        ? `${new Date(clientForm.certificateVerifiedAt).toLocaleDateString()}${clientForm.certificateVerifiedBy ? ` · ${clientForm.certificateVerifiedBy}` : ''}`
                        : 'Not verified'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-border/60 bg-black/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
                    {certificateLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
                  </div>
                  {certificateFile ? (
                    certificateFile.mimeType === 'application/pdf' ? (
                      <iframe
                        title="Resale certificate preview"
                        src={certificateFile.contentUrl}
                        className="h-72 w-full rounded-md border border-border/60 bg-white"
                      />
                    ) : (
                      <img
                        src={certificateFile.contentUrl}
                        alt="Resale certificate preview"
                        className="max-h-72 w-full rounded-md border border-border/60 object-contain bg-white"
                      />
                    )
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
                      {certificateError || 'No certificate file on file yet.'}
                    </div>
                  )}
                </div>

                <input
                  ref={certificateUploadInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadCertificateFile(file);
                    }
                  }}
                />
                <input
                  ref={certificateCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadCertificateFile(file);
                    }
                  }}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => certificateUploadInputRef.current?.click()}
                    disabled={certificateUploading}
                  >
                    <FileUp className="h-4 w-4" />
                    {certificateFile ? 'Replace' : 'Upload'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => certificateCameraInputRef.current?.click()}
                    disabled={certificateUploading}
                  >
                    <Camera className="h-4 w-4" />
                    Take Picture
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={openCertificate}
                    disabled={!certificateFile}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={printCertificate}
                    disabled={!certificateFile}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => markCertificateStatus('uploaded_unverified')}
                    disabled={!certificateFile}
                  >
                    Needs Review
                  </Button>
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => markCertificateStatus('verified')}
                    disabled={!certificateFile}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Mark Verified
                  </Button>
                </div>

                {certificateUploading && (
                  <p className="mt-2 text-xs text-muted-foreground">Uploading certificate file...</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{clientForm.salesChannel}</Badge>
                <Badge variant="outline">{formatOpsTaxTreatment(clientForm.taxTreatment)}</Badge>
                <Badge variant="outline">Rate: {clientForm.salesTaxRate.toFixed(2)}%</Badge>
                <Badge variant="outline">{formatOpsCertificateStatus(effectiveCertificateStatus)}</Badge>
                {clientForm.resaleCertificateNumber && (
                  <Badge variant="outline">Cert: {clientForm.resaleCertificateNumber}</Badge>
                )}
                {clientForm.sellerPermitNumber && (
                  <Badge variant="outline">Permit: {clientForm.sellerPermitNumber}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium">
                  <Phone className="h-3.5 w-3.5" />
                  {clientForm.phone || 'Not set'}
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  {clientForm.email || 'Not set'}
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-background/20 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {clientForm.address || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : 'Unsaved changes'}
              </p>
              <Button onClick={saveClient}>Save Profile</Button>
            </div>
          </CardContent>
        </Card>

        <Card style={panelStyle}>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription>Most recent customer order activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientRecord.orders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/20 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Delivery: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                </div>
                <Badge className="w-fit border-slate-500/40 bg-slate-500/20 text-slate-200">
                  {order.status.replace('-', ' ')}
                </Badge>
                <p className="text-sm font-semibold">${order.totalAmount.toFixed(2)}</p>
              </div>
            ))}
            {clientRecord.orders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders for this client yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
