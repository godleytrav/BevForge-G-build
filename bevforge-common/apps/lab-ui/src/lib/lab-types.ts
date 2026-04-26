export interface RangeValue {
  min: number;
  max: number;
}

export interface TargetBlock {
  abv: RangeValue;
  ibu: RangeValue;
  srm: RangeValue;
  [metric: string]: RangeValue;
}

export interface ProposalBaseMalt {
  name: string;
  percent: number;
  ppg: number;
  color_srm: number;
  priority?: number;
}

export interface ProposalSpecialty {
  key: string;
  name: string;
  percent: number;
  cap: number;
  ppg?: number;
  color_srm?: number;
  substitution?: string;
}

export interface ProposalHopFamily {
  key: string;
  label: string;
  variety: string;
  alpha_acid: number;
}

export interface ProposalYeastFamily {
  key: string;
  name: string;
  attenuation_shift?: number;
  temp_c?: number;
  duration_days?: number;
  priority?: number;
}

export interface DescriptorOption {
  key: string;
  label: string;
  biases?: {
    targets?: Record<string, Partial<RangeValue>>;
    mash_temp_c?: number;
    water_bias?: string;
    attenuation?: number;
  };
  proposal?: {
    base_malt?: Partial<ProposalBaseMalt>;
    specialties?: Array<Partial<ProposalSpecialty>>;
    hop_family?: Partial<ProposalHopFamily>;
    yeast_family?: Partial<ProposalYeastFamily>;
  };
  excludes?: Array<{ key: string; reason?: string }>;
  category?: string;
  group?: string;
  exclusive?: boolean;
}

export interface DescriptorGroup {
  key: string;
  label: string;
  exclusive?: boolean;
  options: DescriptorOption[];
}

export interface DescriptorCategory {
  label: string;
  groups: DescriptorGroup[];
}

export interface DescriptorLibrary {
  defaults: {
    beverage: string;
    batch_size_l: number;
    efficiency_pct: number;
    attenuation: number;
    targets: TargetBlock;
    proposal: {
      base_malt: ProposalBaseMalt;
      specialties: ProposalSpecialty[];
      hop_families: ProposalHopFamily[];
      yeast_family: ProposalYeastFamily;
      mash_temp_c: number;
      water_bias: string;
    };
  };
  categories: Record<string, DescriptorCategory>;
  conflicts?: Array<{
    keys: string[];
    reason?: string;
  }>;
}

export type IngredientKind = 'fermentable' | 'hop' | 'yeast' | 'adjunct' | 'other';

export interface ProposalIngredient {
  id?: string;
  kind: IngredientKind;
  name: string;
  amount: number;
  unit: string;
  timing?: 'boil' | 'whirlpool' | 'ferment';
  time_min?: number;
  day_offset?: number;
  aa_pct?: number;
  color_srm?: number;
  ppg?: number;
  cost_per_unit?: number;
}

export interface MashStep {
  order_index: number;
  name: string;
  temp_c: number;
  duration_min: number;
}

export interface FermentationStep {
  order_index: number;
  stage: 'primary' | 'secondary' | 'conditioning' | 'cold_crash';
  temp_c: number;
  duration_days: number;
}

export interface SubstitutionResult {
  slot: 'base_malt' | 'specialty' | 'hop' | 'yeast';
  index: number;
  original_name: string;
  replacement_name: string;
  impact: string;
}

export interface ProposalOutput {
  targets: TargetBlock;
  og: number;
  fg: number;
  attenuation: number;
  mash_temp_c: number;
  water_bias: string;
  base_malt: {
    name: string;
    percent: number;
    substitution?: string;
  };
  specialty_caps: ProposalSpecialty[];
  hop_plan: Array<{
    family: string;
    timings: string[];
    variety: string;
    substitution?: string;
  }>;
  yeast_family: string;
  yeast_substitution?: string;
  batch_size_l: number;
  efficiency_pct: number;
  substitutions?: SubstitutionResult[];
}

export interface CloneCandidate {
  id: string;
  name: string;
  brewery?: string;
  ba_class?: string;
  style_key?: string;
  batch_size_l?: number;
  targets?: Partial<TargetBlock>;
  selections?: Record<string, string[]>;
  yeast_family?: {
    key?: string;
    label?: string;
  };
  hop_families?: Array<{
    key?: string;
    label?: string;
  }>;
  water_bias?: string;
}

export interface CatalogIngredient {
  id: string;
  type: string;
  name: string;
  spec_json: Record<string, unknown>;
  sensory_json: Record<string, number>;
  active: boolean;
}

export interface InventoryLot {
  id: string;
  catalog_id: string;
  qty: number;
  unit: string;
  overrides_json: Record<string, number>;
  cost_per_unit?: number;
}

export interface ClassDesignation {
  class_name: string;
  confidence: number;
}

export interface SimilarMatch {
  name: string;
  style: string;
  similarity: number;
  note: string;
}

export interface LabComplianceJurisdiction {
  countryCode: string;
  regionCode: string;
  agency: string;
  permitId?: string;
}

export interface LabTtbComplianceMetadata {
  brewerNoticeNumber: string;
  formulaCode: string;
  taxClass: string;
  processType: string;
}

export interface LabAbcComplianceMetadata {
  stateCode: string;
  licenseNumber: string;
  productCategory: string;
}

export interface LabColaComplianceMetadata {
  required: boolean;
  colaRegistryNumber?: string;
  brandName: string;
  classDesignation: string;
  labelerName: string;
}

export interface LabCompliancePlannerState {
  beverageFamily?: 'beer' | 'cider' | 'wine' | 'mead' | 'other';
  carbonationMode?: 'unknown' | 'still' | 'effervescent';
  carbonationTargetVolumes?: number;
  interstateSale?: boolean;
  hardCiderEligible?: boolean;
  formulaReviewRequired?: boolean;
  labelAuthority?: 'ttb' | 'fda';
  classificationReasons?: string[];
}

export interface LabComplianceProfile {
  schemaVersion: string;
  id: string;
  profileName: string;
  jurisdiction: LabComplianceJurisdiction;
  ttb: LabTtbComplianceMetadata;
  abc: LabAbcComplianceMetadata;
  cola: LabColaComplianceMetadata;
  planner?: LabCompliancePlannerState;
  notes?: string;
}

export interface PredictedMetrics {
  og: number;
  fg: number;
  abv: number;
  ibu: number;
  srm: number;
}

export interface MetricDelta {
  target: number;
  predicted: number;
  delta: number;
}

export interface ManualPredictionOutput {
  predicted: PredictedMetrics;
  warnings: string[];
  descriptor_profile: Array<{
    key: string;
    score: number;
  }>;
  class_designation?: ClassDesignation;
  similar_to: SimilarMatch[];
  target_vs_predicted: {
    abv: MetricDelta;
    ibu: MetricDelta;
    srm: MetricDelta;
  };
}

export interface ComputeProposalInput {
  selections: Record<string, string[]>;
  targets: TargetBlock;
  batch_size_l: number;
  efficiency_pct: number;
  prefer_in_stock: boolean;
}

export interface ComputeProposalOutput {
  proposal: ProposalOutput;
  ingredients: ProposalIngredient[];
  mash_steps: MashStep[];
  fermentation_steps: FermentationStep[];
  class_designation?: ClassDesignation;
  similar_to: SimilarMatch[];
}

export interface SavedLabRecipe {
  id: string;
  name: string;
  beverage: string;
  style_key: string;
  mode?: 'dynamic' | 'standard' | 'hybrid';
  equipment_profile_id?: string;
  mash_profile_id?: string;
  fermentation_profile_id?: string;
  water_profile_id?: string;
  water_bias?: string;
  inventory_ledger?: {
    reserved: Record<string, number>;
    used: Record<string, number>;
    removed: Record<string, number>;
  };
  selections: Record<string, string[]>;
  targets: TargetBlock;
  manual_ingredients?: ProposalIngredient[];
  proposal: ProposalOutput;
  ingredients: ProposalIngredient[];
  mash_steps: MashStep[];
  fermentation_steps: FermentationStep[];
  compliance_profile?: LabComplianceProfile;
  class_designation?: ClassDesignation;
  similar_to: SimilarMatch[];
  created_at: string;
  updated_at: string;
}
