import fs from 'fs';
import path from 'path';
import { isGeminiConfigured } from './config';
import {
  AdminMetrics,
  ChatMessage,
  MedicineScheduleItem,
  Prescription,
  UserProfile,
} from '../src/types';
import { KNOWN_DRUG_DATABASE, MEDICAL_ABBREVIATIONS } from './medicalKnowledge';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'prescription_store.json');

interface Schema {
  users: UserProfile[];
  prescriptions: Prescription[];
  chats: Record<string, ChatMessage[]>;
  auditLogs: { timestamp: string; action: string; userId: string; details: string }[];
  metrics: AdminMetrics;
}

// Initial Demo Prescription
const createDemoPrescription = (userId: string): Prescription => {
  const amox = KNOWN_DRUG_DATABASE.amoxicillin;
  const panto = KNOWN_DRUG_DATABASE.pantoprazole;
  const para = KNOWN_DRUG_DATABASE.paracetamol;

  const morningSchedule: MedicineScheduleItem[] = [
    {
      medicineId: 'demo_med_1',
      medicineName: 'Pantoprazole 40 mg',
      strength: '40 mg',
      dose: '1 tablet',
      route: 'Oral (By mouth)',
      instructions: 'Take 30–60 minutes before breakfast on an empty stomach.',
      withFoodNotes: 'Before breakfast (empty stomach)',
      duration: '7 days',
      timingCategory: 'morning',
    },
    {
      medicineId: 'demo_med_2',
      medicineName: 'Amoxicillin + Clavulanic Acid 625 mg (Augmentin)',
      strength: '625 mg',
      dose: '1 tablet',
      route: 'Oral (By mouth)',
      instructions: 'Take immediately after morning meal with a full glass of water.',
      withFoodNotes: 'After morning meal',
      duration: '5 days',
      timingCategory: 'morning',
    },
  ];

  const afternoonSchedule: MedicineScheduleItem[] = [];

  const eveningSchedule: MedicineScheduleItem[] = [
    {
      medicineId: 'demo_med_2',
      medicineName: 'Amoxicillin + Clavulanic Acid 625 mg (Augmentin)',
      strength: '625 mg',
      dose: '1 tablet',
      route: 'Oral (By mouth)',
      instructions: 'Take 12 hours after the morning dose, after dinner.',
      withFoodNotes: 'After evening meal',
      duration: '5 days',
      timingCategory: 'evening',
    },
  ];

  const asNeededSchedule: MedicineScheduleItem[] = [
    {
      medicineId: 'demo_med_3',
      medicineName: 'Paracetamol 650 mg (Dolo 650)',
      strength: '650 mg',
      dose: '1 tablet',
      route: 'Oral',
      instructions: 'Take every 6 hours ONLY if fever (>100°F) or significant post-operative pain occurs. Do not exceed 4 tablets in 24 hours.',
      withFoodNotes: 'With or after food',
      duration: 'As needed (3 days max)',
      timingCategory: 'as_needed',
    },
  ];

  return {
    id: 'demo_rx_001',
    userId,
    title: 'Post-Procedure Antibiotic & Recovery Care Plan (DEMO)',
    doctorName: 'Dr. Sarah Jenkins, MD',
    clinicName: 'St. Jude Community Wellness Hospital',
    date: new Date().toISOString().split('T')[0],
    sourceType: 'demo',
    rawInputText: `Rx:
1. Tab Pantocid (Pantoprazole) 40mg - 1 tab OD (AC) x 7 days
2. Tab Augmentin 625 (Amoxicillin + Clav) - 1 tab BD (PC) x 5 days
3. Tab Dolo 650 (Paracetamol) - 1 tab SOS / PRN for pain or fever (max 3/day)
Special Notes: Drink plenty of fluids. Complete full course of antibiotics. Avoid NSAIDs without consulting.`,
    overallConfidence: 'high',
    confidenceScore: 96,
    status: 'analyzed',
    medicines: [
      {
        id: 'demo_med_1',
        name: 'Pantoprazole (Pantocid)',
        brandName: 'Pantocid',
        genericName: 'Pantoprazole',
        strength: '40 mg',
        dosage: '1 tablet',
        frequency: 'Once Daily (OD)',
        frequencyExpanded: 'Take once every morning before eating.',
        route: 'Oral',
        duration: '7 days',
        instructions: 'Swallow whole with water 30–60 minutes before breakfast.',
        timingOfDay: ['morning'],
        withFood: 'before_food',
        confidence: {
          name: 'high',
          strength: 'high',
          dosage: 'high',
          frequency: 'high',
          duration: 'high',
          overall: 'high',
          notes: 'Standard therapeutic anti-ulcer regimen.',
        },
        userVerified: true,
        educationalInfo: panto,
      },
      {
        id: 'demo_med_2',
        name: 'Amoxicillin & Potassium Clavulanate (Augmentin 625)',
        brandName: 'Augmentin 625',
        genericName: 'Amoxicillin + Clavulanic Acid',
        strength: '625 mg',
        dosage: '1 tablet',
        frequency: 'Twice Daily (BD / BID)',
        frequencyExpanded: 'Take two times a day, spaced by roughly 12 hours (morning and night) with food.',
        route: 'Oral',
        duration: '5 days',
        instructions: 'Take right after meals. Complete the entire 5-day course.',
        timingOfDay: ['morning', 'evening'],
        withFood: 'after_food',
        confidence: {
          name: 'high',
          strength: 'high',
          dosage: 'high',
          frequency: 'high',
          duration: 'high',
          overall: 'high',
        },
        userVerified: true,
        educationalInfo: amox,
      },
      {
        id: 'demo_med_3',
        name: 'Paracetamol (Dolo 650)',
        brandName: 'Dolo 650',
        genericName: 'Paracetamol',
        strength: '650 mg',
        dosage: '1 tablet',
        frequency: 'As Needed (PRN / SOS)',
        frequencyExpanded: 'Take only when pain or fever is present, keeping at least 6 hours between doses.',
        route: 'Oral',
        duration: 'As needed (up to 3 days)',
        instructions: 'Take with a glass of water. Do not exceed 4,000 mg across all medications daily.',
        timingOfDay: ['as_needed'],
        withFood: 'with_food',
        confidence: {
          name: 'high',
          strength: 'high',
          dosage: 'high',
          frequency: 'high',
          duration: 'high',
          overall: 'high',
        },
        userVerified: true,
        educationalInfo: para,
      },
    ],
    simplifiedSchedule: {
      morning: morningSchedule,
      afternoon: afternoonSchedule,
      evening: eveningSchedule,
      bedtime: [],
      asNeeded: asNeededSchedule,
      unclear: [],
    },
    safetyFindings: [
      {
        id: 'safety_demo_1',
        type: 'general_warning',
        severity: 'info',
        title: 'Complete Antibiotic Course Directive',
        description: 'You have been prescribed Amoxicillin-Clavulanate for 5 days. It is critical to finish all doses even if you feel completely healthy.',
        medicinesInvolved: ['Amoxicillin & Potassium Clavulanate (Augmentin 625)'],
        reason: 'Prematurely stopping antibiotics allows surviving bacteria to develop antibiotic resistance.',
        confidence: 'high',
        actionRequired: 'Set daily reminders to complete all 5 days.',
        explainability: {
          finding: 'Full antibiotic course completion reminder.',
          why: 'Prescription indicates a 5-day bacterial clearance protocol.',
          confidence: 'high',
          whatShouldYouDo: 'Do not stop taking Augmentin early unless directed by your physician due to an allergic reaction.',
        },
      },
      {
        id: 'safety_demo_2',
        type: 'duplicate_ingredient',
        severity: 'info',
        title: 'Check Other Pain or Cold Medications for Paracetamol',
        description: 'Dolo 650 contains Paracetamol. Many over-the-counter flu syrups, headache pills, and sinus tablets also contain paracetamol.',
        medicinesInvolved: ['Paracetamol (Dolo 650)'],
        reason: 'Combining paracetamol sources can cause unintentional liver stress.',
        confidence: 'high',
        actionRequired: 'Check ingredient labels on any other over-the-counter medicine before taking.',
        explainability: {
          finding: 'Potential duplicate active ingredient caution.',
          why: 'Paracetamol is widely used in multiple combination brand medications.',
          confidence: 'high',
          whatShouldYouDo: 'Always tell your pharmacist you are already taking 650 mg paracetamol.',
        },
      },
    ],
    interactions: [],
    duplicateDetections: [],
    abbreviationsFound: [
      {
        abbr: 'OD',
        meaning: 'Omni Die (Once Daily)',
        plainExplanation: 'Take once every day in the morning.',
        category: 'frequency',
      },
      {
        abbr: 'BD',
        meaning: 'Bis In Die (Twice Daily)',
        plainExplanation: 'Take twice a day, 12 hours apart.',
        category: 'frequency',
      },
      {
        abbr: 'AC',
        meaning: 'Ante Cibum (Before Meals)',
        plainExplanation: 'Take before eating food (on an empty stomach).',
        category: 'timing',
      },
      {
        abbr: 'PC',
        meaning: 'Post Cibum (After Meals)',
        plainExplanation: 'Take after finishing your meal.',
        category: 'timing',
      },
      {
        abbr: 'SOS / PRN',
        meaning: 'Si Opus Sit (As Needed)',
        plainExplanation: 'Take only when fever or pain is felt.',
        category: 'condition',
      },
    ],
    questionsForDoctor: [
      'What should I do if I experience mild stomach cramps from the antibiotic?',
      'Should I continue taking Pantoprazole if my stomach feels completely normal?',
      'How many hours should I wait between my morning and evening Augmentin doses?',
      'When is my scheduled follow-up appointment to confirm the recovery progress?',
    ],
    simplifiedSummary:
      'This prescription consists of 3 medications: Pantoprazole to protect your stomach before breakfast, Augmentin 625 antibiotic taken twice daily with meals for 5 days, and Dolo 650 (Paracetamol) taken only as needed for discomfort or fever.',
    language: 'en',
    patientNotes: 'Sample demo record for interactive testing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

class Database {
  private data: Schema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): Schema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing fresh store.', e);
    }

    const defaultUser: UserProfile = {
      id: 'demo_user_001',
      email: 'patient@healthsafe.org',
      name: 'Alex Morgan',
      allergies: ['Penicillin (mild rash in childhood) - Check with doctor', 'Sulfa drugs'],
      conditions: ['Mild Hypertension', 'Occasional Acid Reflux'],
      isPregnant: false,
      ageGroup: 'adult',
      preferredLanguage: 'en',
      simpleMode: false,
    };

    const initialPrescription = createDemoPrescription(defaultUser.id);

    return {
      users: [defaultUser],
      prescriptions: [initialPrescription],
      chats: {
        [initialPrescription.id]: [
          {
            id: 'msg_001',
            prescriptionId: initialPrescription.id,
            sender: 'assistant',
            text: 'Hello! I have reviewed your recovery prescription. I can explain medicine timings, what each tablet does, side-effect warning signs, and questions to ask your doctor. How can I help you today?',
            timestamp: new Date().toISOString(),
            suggestedQuestions: [
              'What does Augmentin 625 do?',
              'Why should Pantoprazole be taken before food?',
              'What should I do if I miss my evening dose?',
            ],
          },
        ],
      },
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: 'DEMO_INITIALIZED',
          userId: defaultUser.id,
          details: 'Initialized demo prescription record.',
        },
      ],
      metrics: {
        totalUsers: 1,
        totalPrescriptions: 1,
        totalAiAnalyses: 1,
        unclearPrescriptionRate: 0,
        detectedInteractionsCount: 0,
        detectedDuplicatesCount: 0,
        avgConfidenceScore: 96,
        systemStatus: 'healthy',
        activeAiProvider: isGeminiConfigured() ? 'Gemini 3.7 Flash' : 'Medical Knowledge Engine (Offline Mode)',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // Users
  getUser(id: string): UserProfile | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): UserProfile | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(profile: Partial<UserProfile>): UserProfile {
    const user: UserProfile = {
      id: profile.id || `user_${Date.now()}`,
      email: profile.email || 'patient@example.com',
      name: profile.name || 'Patient',
      allergies: profile.allergies || [],
      conditions: profile.conditions || [],
      isPregnant: profile.isPregnant || false,
      ageGroup: profile.ageGroup || 'adult',
      preferredLanguage: profile.preferredLanguage || 'en',
      simpleMode: profile.simpleMode || false,
    };
    this.data.users.push(user);
    this.data.metrics.totalUsers = this.data.users.length;
    this.logAction('USER_REGISTERED', user.id, 'New user profile created.');
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.persist();
    return this.data.users[index];
  }

  // Prescriptions
  getPrescriptions(userId: string): Prescription[] {
    return this.data.prescriptions
      .filter((p) => p.userId === userId && p.status !== 'archived')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPrescription(id: string, userId: string): Prescription | undefined {
    return this.data.prescriptions.find((p) => p.id === id && p.userId === userId);
  }

  savePrescription(prescription: Prescription): Prescription {
    const existingIndex = this.data.prescriptions.findIndex((p) => p.id === prescription.id);
    if (existingIndex >= 0) {
      this.data.prescriptions[existingIndex] = { ...prescription, updatedAt: new Date().toISOString() };
    } else {
      this.data.prescriptions.push(prescription);
      this.data.metrics.totalPrescriptions = this.data.prescriptions.length;
      this.data.metrics.totalAiAnalyses += 1;
    }
    this.logAction('PRESCRIPTION_SAVED', prescription.userId, `Prescription ${prescription.id} saved/updated.`);
    this.updateMetrics();
    this.persist();
    return prescription;
  }

  deletePrescription(id: string, userId: string): boolean {
    const index = this.data.prescriptions.findIndex((p) => p.id === id && p.userId === userId);
    if (index >= 0) {
      this.data.prescriptions.splice(index, 1);
      delete this.data.chats[id];
      this.logAction('PRESCRIPTION_DELETED', userId, `Prescription ${id} permanently removed.`);
      this.updateMetrics();
      this.persist();
      return true;
    }
    return false;
  }

  // Chat
  getChat(prescriptionId: string): ChatMessage[] {
    return this.data.chats[prescriptionId] || [];
  }

  addChatMessage(prescriptionId: string, message: ChatMessage) {
    if (!this.data.chats[prescriptionId]) {
      this.data.chats[prescriptionId] = [];
    }
    this.data.chats[prescriptionId].push(message);
    this.persist();
  }

  // Medication Cabinet Organizer
  getMedicationCabinet(userId: string) {
    const prescriptions = this.getPrescriptions(userId);
    const activeMeds: { medicine: any; prescriptionTitle: string; rxDate: string; rxId: string }[] = [];

    for (const rx of prescriptions) {
      for (const med of rx.medicines) {
        activeMeds.push({
          medicine: med,
          prescriptionTitle: rx.title,
          rxDate: rx.date,
          rxId: rx.id,
        });
      }
    }
    return {
      activeMeds,
      totalPrescriptions: prescriptions.length,
      recentDate: prescriptions[0]?.date || 'None',
    };
  }

  // Admin & Audit
  getMetrics(): AdminMetrics {
    this.updateMetrics();
    return this.data.metrics;
  }

  getAuditLogs() {
    return this.data.auditLogs.slice(-50);
  }

  logAction(action: string, userId: string, details: string) {
    this.data.auditLogs.push({
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
    });
  }

  private updateMetrics() {
    const total = this.data.prescriptions.length;
    let unclearCount = 0;
    let interactionCount = 0;
    let duplicateCount = 0;
    let scoreSum = 0;

    for (const p of this.data.prescriptions) {
      if (p.overallConfidence === 'low' || p.medicines.some((m) => m.confidence.overall === 'low')) {
        unclearCount++;
      }
      interactionCount += p.interactions.length;
      duplicateCount += p.duplicateDetections.length;
      scoreSum += p.confidenceScore || 85;
    }

    this.data.metrics = {
      totalUsers: this.data.users.length,
      totalPrescriptions: total,
      totalAiAnalyses: Math.max(total, this.data.metrics.totalAiAnalyses),
      unclearPrescriptionRate: total > 0 ? Math.round((unclearCount / total) * 100) : 0,
      detectedInteractionsCount: interactionCount,
      detectedDuplicatesCount: duplicateCount,
      avgConfidenceScore: total > 0 ? Math.round(scoreSum / total) : 90,
      systemStatus: 'healthy',
      activeAiProvider: isGeminiConfigured() ? 'Gemini 3.7 Flash' : 'Medical Knowledge Engine (Local)',
      lastUpdated: new Date().toISOString(),
    };
  }

  resetDemoData(userId: string): Prescription {
    const demo = createDemoPrescription(userId);
    this.savePrescription(demo);
    this.data.chats[demo.id] = [
      {
        id: `msg_init_${Date.now()}`,
        prescriptionId: demo.id,
        sender: 'assistant',
        text: 'Hello! I have loaded the demo recovery prescription. You can ask me what each medicine is for, verify timings, or inspect drug safety checks.',
        timestamp: new Date().toISOString(),
        suggestedQuestions: [
          'What is the purpose of Pantoprazole?',
          'Why must I take Augmentin for the full 5 days?',
          'What are the signs of an allergic reaction?',
        ],
      },
    ];
    this.persist();
    return demo;
  }
}

export const db = new Database();
