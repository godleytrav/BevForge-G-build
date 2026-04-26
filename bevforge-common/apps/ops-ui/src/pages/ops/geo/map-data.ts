import type { OpsClientRecord, OpsLeadRecord } from '../crm/data';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface OpsProspectCandidate {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  description: string;
  openingHours: string[];
  point: GeoPoint;
}

const MAP_ANCHOR: GeoPoint = {
  lat: 38.5816,
  lng: -121.4944,
};

const SEEDED_PROSPECTS: OpsProspectCandidate[] = [
  {
    id: 'poi-farmhaus',
    name: 'Farmhaus',
    address: '8230 Auburn Folsom Rd',
    city: 'Granite Bay',
    state: 'CA',
    zip: '95746',
    phone: '+1 916-772-3276',
    website: 'https://www.farmhausgb.com/',
    description: 'Stylish New American eatery with inventive fare and wine.',
    openingHours: [
      'Mon: Closed',
      'Tue: 11:30 AM - 2:30 PM, 5:00 PM - 9:00 PM',
      'Wed: 11:30 AM - 2:30 PM, 5:00 PM - 9:00 PM',
    ],
    point: { lat: 38.7518, lng: -121.1683 },
  },
  {
    id: 'poi-fat-rabbit',
    name: 'The Fat Rabbit Public House',
    address: '2110 Broadstone Pkwy',
    city: 'Folsom',
    state: 'CA',
    zip: '95630',
    phone: '+1 916-985-3289',
    website: '',
    description: 'Neighborhood public house and craft beverage destination.',
    openingHours: ['Tue-Sun: 11:00 AM - 10:00 PM'],
    point: { lat: 38.6569, lng: -121.1156 },
  },
  {
    id: 'poi-scotts-roundhouse',
    name: "Scott's Seafood Roundhouse",
    address: '1264 Broadstone Pkwy',
    city: 'Folsom',
    state: 'CA',
    zip: '95630',
    phone: '',
    website: '',
    description: 'Upscale seafood restaurant with bar service.',
    openingHours: ['Mon-Sun: 11:30 AM - 9:30 PM'],
    point: { lat: 38.6626, lng: -121.1214 },
  },
  {
    id: 'poi-bar-of-america',
    name: 'Bar of America',
    address: '10040 Donner Pass Rd',
    city: 'Truckee',
    state: 'CA',
    zip: '96161',
    phone: '',
    website: '',
    description: 'Historic tavern and dining destination in Truckee.',
    openingHours: ['Mon-Sun: 11:00 AM - 10:00 PM'],
    point: { lat: 39.3272, lng: -120.1833 },
  },
];

const KNOWN_LOCATION_KEYWORDS: Array<{ key: string; point: GeoPoint }> = [
  { key: "joe's pub", point: { lat: 38.6405, lng: -121.1301 } },
  { key: 'test city', point: { lat: 38.6422, lng: -121.1398 } },
  { key: 'granite bay', point: { lat: 38.7427, lng: -121.1711 } },
  { key: 'folsom', point: { lat: 38.6779, lng: -121.1761 } },
  { key: 'truckee', point: { lat: 39.3279, lng: -120.1833 } },
];

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const normalizeText = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
};

const pointFromSeed = (seed: string): GeoPoint => {
  const hash = hashString(seed || 'ops-seed');
  const latOffset = ((hash & 0xffff) / 0xffff - 0.5) * 0.45;
  const lngOffset = ((((hash >> 8) & 0xffff) / 0xffff) - 0.5) * 0.55;
  return {
    lat: clamp(MAP_ANCHOR.lat + latOffset, 37.8, 39.5),
    lng: clamp(MAP_ANCHOR.lng + lngOffset, -121.95, -120.0),
  };
};

const resolveByKnownKeywords = (text: string): GeoPoint | null => {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const keyword = KNOWN_LOCATION_KEYWORDS.find((entry) => normalized.includes(entry.key));
  return keyword?.point ?? null;
};

export const resolveGeoPoint = (input: {
  idSeed: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}): GeoPoint => {
  const hasManualCoords =
    typeof input.lat === 'number' &&
    Number.isFinite(input.lat) &&
    typeof input.lng === 'number' &&
    Number.isFinite(input.lng) &&
    (Math.abs(input.lat) > 0.000001 || Math.abs(input.lng) > 0.000001);

  if (hasManualCoords) {
    return { lat: input.lat, lng: input.lng };
  }

  const text = [input.name, input.address, input.city, input.state].filter(Boolean).join(' ');
  const known = resolveByKnownKeywords(text);
  if (known) {
    return known;
  }

  return pointFromSeed([input.idSeed, text].filter(Boolean).join('|'));
};

export const getSeedProspectCandidates = (): OpsProspectCandidate[] => {
  return SEEDED_PROSPECTS;
};

export const dedupeProspects = (
  prospects: OpsProspectCandidate[],
  leads: OpsLeadRecord[],
  clients: OpsClientRecord[]
): OpsProspectCandidate[] => {
  const leadNameAddress = new Set(
    leads.map((lead) => `${normalizeText(lead.name)}|${normalizeText(lead.address)}`)
  );
  const clientNameAddress = new Set(
    clients.map((client) => `${normalizeText(client.name)}|${normalizeText(client.address)}`)
  );

  return prospects.filter((prospect) => {
    const key = `${normalizeText(prospect.name)}|${normalizeText(prospect.address)}`;
    return !leadNameAddress.has(key) && !clientNameAddress.has(key);
  });
};
