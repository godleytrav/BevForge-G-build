import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import { apiGet, apiPost } from "@/lib/api";
import {
  buildOpsTaxProfileSnapshot,
  defaultOpsTaxProfile,
  formatOpsCertificateStatus,
  formatOpsSalesChannel,
  formatOpsTaxTreatment,
  resolveOpsCertificateStatus,
} from "@/lib/ops-tax";
import {
  formatMobileDate,
  mobileGlassClass,
  queueStatusClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";
import { getOpsClientRecord, saveOpsClientRecord, type OpsClientRecord } from "@/pages/ops/crm/data";
import { ArrowLeft, Camera, ExternalLink, FileUp, ShieldCheck } from "lucide-react";

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

export default function OpsMobileAccountDetailPage() {
  const { accountId } = useParams();
  const { view } = useOpsMobile();
  const account = view.accounts.find((candidate) => candidate.id === accountId);
  const [clientRecord, setClientRecord] = useState<OpsClientRecord | null>(null);
  const [certificateFile, setCertificateFile] = useState<ClientCertificateFile | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const certificateUploadInputRef = useRef<HTMLInputElement | null>(null);
  const certificateCameraInputRef = useRef<HTMLInputElement | null>(null);
  const recentQueue = view.recentQueue.filter(
    (item) => item.accountId === accountId || item.siteId === accountId,
  );

  useEffect(() => {
    if (!accountId) {
      return;
    }

    setClientRecord(getOpsClientRecord(accountId));
    setCertificateLoading(true);
    setCertificateError(null);

    apiGet<ClientCertificateFile>(
      `/api/ops/crm/certificates/${encodeURIComponent(accountId)}`,
    )
      .then((record) => {
        setCertificateFile(record);
      })
      .catch(() => {
        setCertificateFile(null);
      })
      .finally(() => {
        setCertificateLoading(false);
      });
  }, [accountId]);

  if (!account) {
    return (
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardContent className="space-y-4 p-4">
          <p className="text-lg font-semibold text-white">Account not found</p>
          <p className="text-sm text-white/65">
            This account is not present in the current mobile cache.
          </p>
          <Link
            to="/ops/mobile"
            className="inline-flex items-center gap-2 text-sm text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to mobile home
          </Link>
        </CardContent>
      </Card>
    );
  }

  const resolvedTaxProfile = clientRecord?.taxProfile ?? defaultOpsTaxProfile();
  const resolvedCertificateStatus = resolveOpsCertificateStatus(resolvedTaxProfile);

  const handleCertificateUpload = async (file: globalThis.File | null) => {
    if (!file || !accountId) {
      return;
    }

    setCertificateUploading(true);
    setCertificateError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new globalThis.FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }
          reject(new Error("Failed to read certificate file."));
        };
        reader.onerror = () => reject(new Error("Failed to read certificate file."));
        reader.readAsDataURL(file);
      });

      const result = await apiPost<ClientCertificateFile>("/api/ops/crm/certificates", {
        clientId: accountId,
        fileName: file.name || "resale-certificate.jpg",
        mimeType: file.type || "image/jpeg",
        dataUrl,
      });

      const nextRecord = saveOpsClientRecord({
        id: accountId,
        name: clientRecord?.name || account.name,
        contactName: clientRecord?.contactName || account.contactName || "",
        phone: clientRecord?.phone || account.phone || "",
        email: clientRecord?.email || account.email || "",
        googlePlaceId: clientRecord?.googlePlaceId,
        address: clientRecord?.address || account.address || "",
        city: clientRecord?.city || "",
        state: clientRecord?.state || "",
        zip: clientRecord?.zip || "",
        lat: clientRecord?.lat ?? 0,
        lng: clientRecord?.lng ?? 0,
        status: clientRecord?.status || "active",
        notes: clientRecord?.notes || "",
        taxProfile: buildOpsTaxProfileSnapshot({
          ...(clientRecord?.taxProfile ?? defaultOpsTaxProfile()),
          certificateStatus: "uploaded_unverified",
          certificateFileName: result.fileName,
          certificateCapturedAt: result.updatedAt,
          certificateVerifiedAt: "",
          certificateVerifiedBy: "",
        }),
      });

      setClientRecord(nextRecord);
      setCertificateFile(result);
    } catch (error) {
      setCertificateError(
        error instanceof Error ? error.message : "Failed to upload certificate file.",
      );
    } finally {
      setCertificateUploading(false);
      if (certificateUploadInputRef.current) {
        certificateUploadInputRef.current.value = "";
      }
      if (certificateCameraInputRef.current) {
        certificateCameraInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/ops/mobile"
        className="inline-flex items-center gap-2 text-sm text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to mobile home
      </Link>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">{account.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/65">
                {account.address || "Address missing"}
              </p>
              <p className="mt-1 text-sm text-white/65">
                {account.contactName || "No contact"} · {account.phone || "No phone"}
              </p>
            </div>
            <Badge className="border-white/15 bg-white/8 text-white/75">
              {account.status}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Active
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {account.activeOrderCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Delivered
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {account.deliveredOrderCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                On route
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {account.onRouteOrderCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Next delivery
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMobileDate(account.nextDeliveryDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/ops/mobile/visits/new?accountId=${account.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
            >
              New warm visit
            </Link>
            {account.lastRouteId ? (
              <Link
                to={`/ops/mobile/routes/${account.lastRouteId}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
              >
                Open route
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <ShieldCheck className="h-5 w-5" />
            Compliance snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {formatOpsSalesChannel(resolvedTaxProfile.salesChannel)} ·{" "}
                {formatOpsTaxTreatment(resolvedTaxProfile.taxTreatment)}
              </p>
              <p className="mt-1 text-sm text-white/60">
                Certificate status: {formatOpsCertificateStatus(resolvedCertificateStatus)}
              </p>
            </div>
            <Badge className="border-white/15 bg-white/8 text-white/75">
              {formatOpsCertificateStatus(resolvedCertificateStatus)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Resale certificate #
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {resolvedTaxProfile.resaleCertificateNumber || "Not set"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Seller permit #
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {resolvedTaxProfile.sellerPermitNumber || "Not set"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Certificate file
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {resolvedTaxProfile.certificateFileName || certificateFile?.fileName || "No file uploaded"}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {resolvedTaxProfile.certificateCapturedAt
                ? `Captured ${new Date(resolvedTaxProfile.certificateCapturedAt).toLocaleString()}`
                : "Capture a certificate photo or upload a file while you are on site."}
            </p>
            {certificateLoading ? (
              <p className="mt-2 text-xs text-white/45">Loading certificate preview...</p>
            ) : null}
            {certificateError ? (
              <p className="mt-2 text-xs text-amber-100/85">{certificateError}</p>
            ) : null}
          </div>

          <input
            ref={certificateUploadInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(event) => {
              void handleCertificateUpload(event.target.files?.[0] ?? null);
            }}
          />
          <input
            ref={certificateCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              void handleCertificateUpload(event.target.files?.[0] ?? null);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
              onClick={() => certificateUploadInputRef.current?.click()}
              disabled={certificateUploading}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {certificateFile ? "Replace File" : "Upload File"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
              onClick={() => certificateCameraInputRef.current?.click()}
              disabled={certificateUploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Picture
            </Button>
            {certificateFile ? (
              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
                onClick={() => {
                  globalThis.open(certificateFile.contentUrl, "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open File
              </Button>
            ) : null}
          </div>

          {certificateUploading ? (
            <p className="text-xs text-white/45">Uploading certificate file...</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-white">Stop history in cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.stops.length > 0 ? (
              account.stops.map((stop) => (
                <Link
                  key={stop.id}
                  to={`/ops/mobile/stops/${stop.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{stop.routeLabel}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {stop.eventSnapshot.deliveredCount} delivered · {stop.pendingCount} pending writes
                      </p>
                    </div>
                    <Badge className={stopStatusClass(stop.localStatus)}>
                      {stop.localStatus.replace("-", " ")}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
                No cached stops for this account yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-white">Recent mobile activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/6 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{item.summary}</p>
                  <Badge className={queueStatusClass(item.syncStatus)}>
                    {item.syncStatus}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/65">
                  {item.detail ?? "Local mobile account event"}
                </p>
              </div>
            ))}

            {recentQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
                No mobile activity is attached to this account yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
