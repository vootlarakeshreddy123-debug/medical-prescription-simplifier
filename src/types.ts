export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export interface MedicineConfidence {
  name: ConfidenceLevel;
  strength: ConfidenceLevel;
  dosage: ConfidenceLevel;
  frequency: ConfidenceLevel;
  duration: ConfidenceLevel;
  overall: ConfidenceLevel;
  notes?: string;
}

export interface EducationalInfo {
  category: string;
  commonUses: string[];
  howItWorksSimple: string;
  administrationAdvice: string;
  sideEffects: {
    common: string[];
    important: string[];
    urgent: string[];
  };
  precautions: string[];
  storage: string;
  missedDoseAdvice: string;
}

export interface Medicine {
  id: string;
  name: string;
  brandName?: string;
  genericName: string;
  strength: string;
  dosage: string;
  frequency: string;
  frequencyExpanded?: string;
  route: string;
  duration: string;
  instructions: string;
  timingOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear')[];
  withFood?: 'before_food' | 'with_food' | 'after_food' | 'empty_stomach' | 'unspecified';
  confidence: MedicineConfidence;
  userVerified: boolean;
  educationalInfo?: EducationalInfo;
}

export interface MedicineScheduleItem {
  medicineId: string;
  medicineName: string;
  strength: string;
  dose: string;
  route: string;
  instructions: string;
  withFoodNotes: string;
  duration: string;
  timingCategory: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear';
}

export interface SafetyFinding {
  id: string;
  type:
    | 'unclear_dosage'
    | 'missing_duration'
    | 'unclear_frequency'
    | 'duplicate_ingredient'
    | 'drug_interaction'
    | 'allergy_concern'
    | 'contraindication'
    | 'general_warning';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  medicinesInvolved: string[];
  reason: string;
  confidence: ConfidenceLevel;
  actionRequired: string;
  explainability: {
    finding: string;
    why: string;
    confidence: ConfidenceLevel;
    whatShouldYouDo: string;
  };
}

export interface DrugInteraction {
  id: string;
  medicineA: string;
  medicineB: string;
  status: 'no_known_interaction' | 'potential_interaction' | 'significant_interaction' | 'unable_to_verify';
  severity: 'mild' | 'moderate' | 'major' | 'none' | 'unknown';
  description: string;
  mechanism?: string;
  recommendation: string;
}

export interface DuplicateDetection {
  activeIngredient: string;
  medicines: string[];
  explanation: string;
  warning: string;
}

export interface AbbreviationDefinition {
  abbr: string;
  meaning: string;
  plainExplanation: string;
  category: 'frequency' | 'route' | 'timing' | 'condition' | 'other';
  ambiguous?: boolean;
  warningNote?: string;
}

export type MedicalAbbreviation = AbbreviationDefinition;

export interface AuditLog {
  id?: string;
  timestamp: string;
  action: string;
  userId: string;
  details: string;
}

export interface Prescription {
  id: string;
  userId: string;
  title: string;
  doctorName?: string;
  clinicName?: string;
  date: string;
  sourceType: 'image' | 'pdf' | 'manual' | 'text' | 'demo';
  rawInputText?: string;
  imageUrl?: string;
  overallConfidence: ConfidenceLevel;
  confidenceScore: number; // 0 - 100
  status: 'extracted' | 'verified' | 'analyzed' | 'archived';
  medicines: Medicine[];
  simplifiedSchedule: {
    morning: MedicineScheduleItem[];
    afternoon: MedicineScheduleItem[];
    evening: MedicineScheduleItem[];
    bedtime: MedicineScheduleItem[];
    asNeeded: MedicineScheduleItem[];
    unclear: MedicineScheduleItem[];
  };
  safetyFindings: SafetyFinding[];
  interactions: DrugInteraction[];
  duplicateDetections: DuplicateDetection[];
  questionsForDoctor: string[];
  abbreviationsFound: AbbreviationDefinition[];
  simplifiedSummary: string;
  language: SupportedLanguage;
  patientNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  allergies?: string[];
  conditions?: string[];
  isPregnant?: boolean;
  ageGroup?: 'pediatric' | 'adult' | 'elderly';
  preferredLanguage: SupportedLanguage;
  simpleMode: boolean;
}

export interface ChatMessage {
  id: string;
  prescriptionId?: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  safetyNotice?: string;
  suggestedQuestions?: string[];
}

export interface AdminMetrics {
  totalUsers: number;
  totalPrescriptions: number;
  totalAiAnalyses: number;
  unclearPrescriptionRate: number;
  detectedInteractionsCount: number;
  detectedDuplicatesCount: number;
  avgConfidenceScore: number;
  systemStatus: 'healthy' | 'degraded' | 'maintenance';
  activeAiProvider: string;
  lastUpdated: string;
}
