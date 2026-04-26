export type OpsClientSalesChannel = 'retail' | 'wholesale' | 'internal';
export type OpsClientAccountType =
  | 'bar'
  | 'restaurant'
  | 'distributor'
  | 'retail_shop'
  | 'club'
  | 'internal'
  | 'other';
export type OpsClientTaxTreatment = 'taxable' | 'resale_exempt' | 'non_revenue';
export type OpsCertificateStatus = 'missing' | 'uploaded_unverified' | 'verified' | 'expired';

export interface OpsTaxProfileSnapshot {
  salesChannel: OpsClientSalesChannel;
  accountType: OpsClientAccountType;
  taxTreatment: OpsClientTaxTreatment;
  salesTaxRate: number;
  certificateStatus: OpsCertificateStatus;
  resaleCertificateNumber?: string;
  resaleCertificateState?: string;
  resaleCertificateExpiresAt?: string;
  certificateFileName?: string;
  certificateCapturedAt?: string;
  certificateVerifiedAt?: string;
  certificateVerifiedBy?: string;
  sellerPermitNumber?: string;
  taxNote?: string;
}

export const DEFAULT_OPS_SALES_TAX_RATE = 0.09;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const parseCertificateExpiryValue = (value?: string): number | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T23:59:59.999`);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.valueOf();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.valueOf();
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const defaultOpsTaxProfile = (): OpsTaxProfileSnapshot => ({
  salesChannel: 'retail',
  accountType: 'other',
  taxTreatment: 'taxable',
  salesTaxRate: DEFAULT_OPS_SALES_TAX_RATE,
  certificateStatus: 'missing',
});

export const isOpsCertificateExpired = (
  expiresAt?: string,
  referenceDate: Date = new Date()
): boolean => {
  const expiresAtValue = parseCertificateExpiryValue(expiresAt);
  if (expiresAtValue === null) {
    return false;
  }
  return expiresAtValue < referenceDate.valueOf();
};

export const resolveOpsCertificateStatus = (
  value:
    | OpsTaxProfileSnapshot
    | Pick<OpsTaxProfileSnapshot, 'certificateStatus' | 'resaleCertificateExpiresAt'>
): OpsCertificateStatus => {
  if (value.certificateStatus === 'missing') {
    return 'missing';
  }
  if (isOpsCertificateExpired(value.resaleCertificateExpiresAt)) {
    return 'expired';
  }
  return value.certificateStatus;
};

export const normalizeOpsTaxProfile = (value: unknown): OpsTaxProfileSnapshot => {
  const row = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const defaultProfile = defaultOpsTaxProfile();

  const salesChannelValue = toTrimmedString(row.salesChannel ?? row.sales_channel);
  const salesChannel: OpsClientSalesChannel =
    salesChannelValue === 'wholesale' || salesChannelValue === 'internal'
      ? salesChannelValue
      : 'retail';

  const accountTypeValue = toTrimmedString(row.accountType ?? row.account_type);
  const accountType: OpsClientAccountType =
    accountTypeValue === 'bar' ||
    accountTypeValue === 'restaurant' ||
    accountTypeValue === 'distributor' ||
    accountTypeValue === 'retail_shop' ||
    accountTypeValue === 'club' ||
    accountTypeValue === 'internal'
      ? accountTypeValue
      : 'other';

  const taxTreatmentValue = toTrimmedString(row.taxTreatment ?? row.tax_treatment);
  const taxTreatment: OpsClientTaxTreatment =
    taxTreatmentValue === 'resale_exempt' || taxTreatmentValue === 'non_revenue'
      ? taxTreatmentValue
      : 'taxable';

  const salesTaxRate = clamp(
    toNumber(row.salesTaxRate ?? row.sales_tax_rate) ?? defaultProfile.salesTaxRate,
    0,
    1
  );
  const certificateStatusValue = toTrimmedString(row.certificateStatus ?? row.certificate_status);
  const certificateStatus: OpsCertificateStatus =
    certificateStatusValue === 'uploaded_unverified' ||
    certificateStatusValue === 'verified' ||
    certificateStatusValue === 'expired'
      ? certificateStatusValue
      : 'missing';

  const resaleCertificateExpiresAt = toTrimmedString(
    row.resaleCertificateExpiresAt ?? row.resale_certificate_expires_at
  );

  return {
    salesChannel,
    accountType,
    taxTreatment,
    salesTaxRate,
    certificateStatus: resolveOpsCertificateStatus({
      certificateStatus,
      resaleCertificateExpiresAt,
    }),
    resaleCertificateNumber: toTrimmedString(
      row.resaleCertificateNumber ?? row.resale_certificate_number
    ),
    resaleCertificateState: toTrimmedString(
      row.resaleCertificateState ?? row.resale_certificate_state
    ),
    resaleCertificateExpiresAt,
    certificateFileName: toTrimmedString(row.certificateFileName ?? row.certificate_file_name),
    certificateCapturedAt: toTrimmedString(row.certificateCapturedAt ?? row.certificate_captured_at),
    certificateVerifiedAt: toTrimmedString(row.certificateVerifiedAt ?? row.certificate_verified_at),
    certificateVerifiedBy: toTrimmedString(row.certificateVerifiedBy ?? row.certificate_verified_by),
    sellerPermitNumber: toTrimmedString(row.sellerPermitNumber ?? row.seller_permit_number),
    taxNote: toTrimmedString(row.taxNote ?? row.tax_note),
  };
};

export const buildOpsTaxProfileSnapshot = (
  value: unknown
): OpsTaxProfileSnapshot => normalizeOpsTaxProfile(value ?? {});

export const calculateOpsTaxAmount = (
  subtotal: number,
  profile: OpsTaxProfileSnapshot
): number => {
  const safeSubtotal = Math.max(0, subtotal);
  if (profile.taxTreatment !== 'taxable') {
    return 0;
  }
  return Number((safeSubtotal * clamp(profile.salesTaxRate, 0, 1)).toFixed(2));
};

export const formatOpsTaxTreatment = (value: OpsClientTaxTreatment): string => {
  switch (value) {
    case 'resale_exempt':
      return 'Resale Exempt';
    case 'non_revenue':
      return 'Internal / Non-Revenue';
    default:
      return 'Taxable';
  }
};

export const formatOpsCertificateStatus = (value: OpsCertificateStatus): string => {
  switch (value) {
    case 'uploaded_unverified':
      return 'Needs Review';
    case 'verified':
      return 'Compliant';
    case 'expired':
      return 'Expired';
    default:
      return 'Missing';
  }
};

export const formatOpsSalesChannel = (value: OpsClientSalesChannel): string => {
  switch (value) {
    case 'wholesale':
      return 'Wholesale';
    case 'internal':
      return 'Internal';
    default:
      return 'Retail';
  }
};

export const formatOpsAccountType = (value: OpsClientAccountType): string => {
  switch (value) {
    case 'retail_shop':
      return 'Retail Shop';
    default:
      return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
  }
};
