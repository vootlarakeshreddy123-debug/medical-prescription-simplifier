import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  // Brand & Nav
  appName: string;
  appSubtitle: string;
  safeEducationalAssistant: string;
  safetyBannerText: string;
  simpleModeOn: string;
  simpleModeOff: string;
  dashboard: string;
  simplifyPrescription: string;
  myMedicines: string;
  history: string;
  safetyCenter: string;
  abbreviations: string;
  privacyRights: string;
  adminTelemetry: string;
  signIn: string;
  myAccount: string;
  signOut: string;
  demoMode: string;
  tryDemo: string;
  exportPdf: string;
  print: string;
  backToDashboard: string;
  back: string;
  cancel: string;
  save: string;
  delete: string;
  confirm: string;
  edit: string;
  close: string;
  verified: string;
  confidence: string;
  date: string;
  prescriber: string;

  // Hero Landing
  heroTag: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  heroConfidenceRating: string;
  heroInteractionWarnings: string;
  heroDoctorQuestions: string;
  heroLanguages: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  step5Title: string;
  step5Desc: string;

  // Dashboard Overview
  totalPrescriptions: string;
  activeMedicines: string;
  safetyCautions: string;
  needsVerification: string;
  quickActions: string;
  uploadNewPrescription: string;
  manualPrescriptionEntry: string;
  browseMedicineCabinet: string;
  exploreSafetyGuide: string;
  searchMedicalAbbreviations: string;
  loadSamplePrescription: string;
  recentPrescriptions: string;
  noPrescriptionsYet: string;
  noPrescriptionsSub: string;
  viewDetails: string;
  allClearNotice: string;
  verificationRequiredNotice: string;

  // Input Studio
  uploadPrescriptionTitle: string;
  uploadPrescriptionSub: string;
  tabPhotoUpload: string;
  tabPdfDocument: string;
  tabPasteText: string;
  tabManualEntry: string;
  dragDropImage: string;
  dragDropSub: string;
  browseFiles: string;
  pastePrescriptionText: string;
  pastePlaceholder: string;
  analyzePrescriptionButton: string;
  analyzingPrescription: string;
  privacyNoticeUpload: string;
  cameraCapture: string;
  or: string;
  prescriptionTitleLabel: string;
  doctorNameLabel: string;
  clinicNameLabel: string;
  addMedicineRow: string;
  medicineName: string;
  dosage: string;
  strength: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;

  // Verification Screen
  verificationTitle: string;
  verificationSubtitle: string;
  highConfidenceBadge: string;
  mediumConfidenceBadge: string;
  lowConfidenceBadge: string;
  clarityNoticeHigh: string;
  clarityNoticeMedium: string;
  clarityNoticeLow: string;
  confirmAndProceed: string;
  editMedicineDetails: string;
  unclearHandwritingAlert: string;

  // Deep Dive Tabs
  tabDailyTimeline: string;
  tabMedicineCards: string;
  tabSideEffects: string;
  tabInteractions: string;
  tabSafetyCenter: string;
  tabDoctorQuestions: string;
  tabAskAi: string;
  tabCompareMeds: string;
  tabSummaryReport: string;

  // Schedule Timeline
  morningTiming: string;
  morningSub: string;
  afternoonTiming: string;
  afternoonSub: string;
  eveningTiming: string;
  eveningSub: string;
  bedtimeTiming: string;
  bedtimeSub: string;
  asNeededTiming: string;
  asNeededSub: string;
  unclearTiming: string;
  beforeFood: string;
  withFood: string;
  afterFood: string;
  emptyStomach: string;
  noMedicinesScheduled: string;

  // Medicine Card Details
  genericName: string;
  brandName: string;
  route: string;
  purposeAndUses: string;
  howItWorks: string;
  administrationTips: string;
  missedDose: string;
  storageInfo: string;
  commonSideEffects: string;
  urgentSideEffects: string;
  precautions: string;

  // Safety & Interactions
  drugInteractionAlert: string;
  duplicateIngredientAlert: string;
  safetyScore: string;
  recommendation: string;
  actionRequired: string;
  noInteractionsDetected: string;
  noDuplicatesDetected: string;

  // Doctor Questions & AI Chat
  questionsHeader: string;
  questionsSub: string;
  copyQuestions: string;
  copiedToClipboard: string;
  askAiHeader: string;
  askAiSub: string;
  askAiPlaceholder: string;
  sendQuestion: string;
  suggestedPrompts: string;
  aiSafetyDisclaimer: string;

  // Cabinet & History
  cabinetTitle: string;
  cabinetSubtitle: string;
  searchMedicines: string;
  allCategories: string;
  filterByTiming: string;
  historyArchiveTitle: string;
  historyArchiveSub: string;
  deletePrescriptionConfirm: string;

  // Abbreviations & Privacy
  abbreviationsTitle: string;
  abbreviationsSubtitle: string;
  searchAbbreviations: string;
  privacyTitle: string;
  privacySubtitle: string;
  purgeAllData: string;
  purgeSuccess: string;

  // Global Footer & Disclaimers
  globalFooterTitle: string;
  globalDisclaimer: string;
  translatingMessage: string;
}

export const UI_TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'Medical Prescription Simplifier',
    appSubtitle: 'Clear • Safe • Patient-Friendly',
    safeEducationalAssistant: 'Safe Educational Assistant',
    safetyBannerText: 'Does not replace a doctor or pharmacist • Always verify prescription details',
    simpleModeOn: '★ Simple Mode: ON',
    simpleModeOff: '☆ Simple Mode',
    dashboard: 'Dashboard',
    simplifyPrescription: 'Simplify Prescription',
    myMedicines: 'My Medicines',
    history: 'History & Archive',
    safetyCenter: 'Safety & Warnings',
    abbreviations: 'Medical Abbreviations',
    privacyRights: 'Privacy & Data Rights',
    adminTelemetry: 'System Health',
    signIn: 'Sign In',
    myAccount: 'My Account',
    signOut: 'Sign Out',
    demoMode: 'Demo Mode',
    tryDemo: 'Try Demo',
    exportPdf: 'Download PDF Guide',
    print: 'Print',
    backToDashboard: 'Back to Dashboard',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save Changes',
    delete: 'Delete',
    confirm: 'Confirm & Continue',
    edit: 'Edit Details',
    close: 'Close',
    verified: 'Verified',
    confidence: 'Confidence',
    date: 'Date',
    prescriber: 'Prescriber',

    heroTag: 'Patient Health Empowerment',
    heroHeadline: 'Medical Prescription Simplifier',
    heroSubheadline: 'Understand your prescription in simple language.',
    heroDescription:
      'Transform confusing medical abbreviations, handwritten instructions, and complex medicine names into clear, transparent, and organized daily medication schedules.',
    heroConfidenceRating: 'Confidence Rating',
    heroInteractionWarnings: 'Interaction Warnings',
    heroDoctorQuestions: 'Doctor Questions',
    heroLanguages: '6 Regional Languages',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle:
      'A safe, 5-step clinical workflow designed to prioritize transparency and patient safety.',
    step1Title: '1. Upload or Paste',
    step1Desc: 'Upload a clear doctor prescription photo, PDF, or paste text instructions.',
    step2Title: '2. Clinical Vision & OCR',
    step2Desc: 'Extracts drug names, strengths, dosage frequencies, and Latin abbreviations.',
    step3Title: '3. Safety Verification',
    step3Desc: 'Checks for duplicate active ingredients, drug interactions, and unclear handwriting.',
    step4Title: '4. Simplified Timeline',
    step4Desc: 'Organizes medications into clear Morning, Afternoon, Evening, and Bedtime slots.',
    step5Title: '5. Regional Multilingual',
    step5Desc: 'Instant switching across Telugu, Hindi, Tamil, Kannada, Malayalam, and English.',

    totalPrescriptions: 'Total Prescriptions',
    activeMedicines: 'Active Medicines',
    safetyCautions: 'Safety Cautions',
    needsVerification: 'Needs Verification',
    quickActions: 'Quick Actions',
    uploadNewPrescription: 'Upload Prescription Photo',
    manualPrescriptionEntry: 'Manual Entry Form',
    browseMedicineCabinet: 'Open Medicine Cabinet',
    exploreSafetyGuide: 'Safety & Interaction Guide',
    searchMedicalAbbreviations: 'Doctor Shorthand Decoder',
    loadSamplePrescription: 'Load Clinical Demo Sample',
    recentPrescriptions: 'Saved Prescription Regimens',
    noPrescriptionsYet: 'No Prescriptions Simplified Yet',
    noPrescriptionsSub: 'Upload your first handwritten doctor prescription to generate a clear daily schedule.',
    viewDetails: 'View Complete Analysis',
    allClearNotice: 'All medications reviewed and verified.',
    verificationRequiredNotice: 'Some items need handwriting verification.',

    uploadPrescriptionTitle: 'Simplify Your Prescription',
    uploadPrescriptionSub:
      'Upload a doctor prescription photo, document, or type medicine names to generate a clear schedule.',
    tabPhotoUpload: 'Prescription Photo',
    tabPdfDocument: 'PDF Document',
    tabPasteText: 'Paste / Type Text',
    tabManualEntry: 'Manual Form',
    dragDropImage: 'Upload Prescription Image',
    dragDropSub: 'Supports JPEG, PNG, WEBP (Clear, well-lit photos work best)',
    browseFiles: 'Browse Files',
    pastePrescriptionText: 'Prescription Text / Doctor Notes',
    pastePlaceholder: 'e.g. Tab Augmentin 625mg 1-0-1 x 5 days after food\nTab Dolo 650mg SOS for fever',
    analyzePrescriptionButton: 'Simplify & Organize Prescription',
    analyzingPrescription: 'Analyzing Prescription...',
    privacyNoticeUpload: '🔒 Encrypted & Private: Your medical data is processed securely.',
    cameraCapture: 'Take Camera Photo',
    or: 'OR',
    prescriptionTitleLabel: 'Prescription Title / Label',
    doctorNameLabel: 'Doctor / Clinic Name (Optional)',
    clinicNameLabel: 'Hospital / Clinic',
    addMedicineRow: '+ Add Another Medicine',
    medicineName: 'Medicine Name',
    dosage: 'Dosage / Count',
    strength: 'Strength (e.g. 500mg)',
    frequency: 'Frequency (e.g. 1-0-1)',
    timing: 'Timing of Day',
    duration: 'Duration (e.g. 5 days)',
    instructions: 'Special Instructions',

    verificationTitle: 'Verify Extracted Prescription Details',
    verificationSubtitle:
      'Please verify extracted drug names and dosages before generating your final schedule.',
    highConfidenceBadge: 'High Confidence (Verified)',
    mediumConfidenceBadge: 'Medium Confidence (Review)',
    lowConfidenceBadge: 'Low Confidence (Please Check)',
    clarityNoticeHigh: 'Clear handwriting detected. Medicine matched to clinical database.',
    clarityNoticeMedium: 'Handwriting was partially cursive. Please confirm dosage.',
    clarityNoticeLow: 'Handwriting was ambiguous. Please confirm with your physical prescription.',
    confirmAndProceed: 'Confirm All Details & Open Schedule',
    editMedicineDetails: 'Edit Item',
    unclearHandwritingAlert: 'Unclear handwriting flag: Please double check original prescription.',

    tabDailyTimeline: '1. Daily Timeline',
    tabMedicineCards: '2. Medicine Cards',
    tabSideEffects: '3. Side-Effects',
    tabInteractions: '4. Interactions & Duplicates',
    tabSafetyCenter: '5. Safety Center',
    tabDoctorQuestions: '6. Doctor Questions',
    tabAskAi: '7. Ask AI Assistant',
    tabCompareMeds: '8. Compare Meds',
    tabSummaryReport: '9. Summary Report',

    morningTiming: 'Morning',
    morningSub: 'Breakfast / 7:00 AM – 9:00 AM',
    afternoonTiming: 'Afternoon',
    afternoonSub: 'Lunch / 12:00 PM – 2:00 PM',
    eveningTiming: 'Evening',
    eveningSub: 'Dinner / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'Bedtime',
    bedtimeSub: 'Before Sleep / 9:30 PM – 11:00 PM',
    asNeededTiming: 'As Needed (SOS)',
    asNeededSub: 'Take only when symptoms occur',
    unclearTiming: 'Timing to Confirm with Doctor',
    beforeFood: 'Before Food',
    withFood: 'With or After Food',
    afterFood: 'After Food',
    emptyStomach: 'Empty Stomach',
    noMedicinesScheduled: 'No medicines scheduled for this time period.',

    genericName: 'Generic Salt Name',
    brandName: 'Brand Name',
    route: 'Route / Method',
    purposeAndUses: 'Primary Purpose & Uses',
    howItWorks: 'How This Medicine Works (Simple)',
    administrationTips: 'How to Take Correctly',
    missedDose: 'What to Do if Missed a Dose',
    storageInfo: 'Storage Recommendations',
    commonSideEffects: 'Common Mild Side Effects',
    urgentSideEffects: 'Important / Urgent Symptoms (Contact Doctor)',
    precautions: 'Safety Precautions',

    drugInteractionAlert: 'Potential Drug Interaction Caution',
    duplicateIngredientAlert: 'Duplicate Active Ingredient Detected',
    safetyScore: 'Regimen Safety Score',
    recommendation: 'Clinical Recommendation',
    actionRequired: 'Action for Patient',
    noInteractionsDetected: 'No harmful drug interactions detected among current medicines.',
    noDuplicatesDetected: 'No duplicate active ingredients detected.',

    questionsHeader: 'Recommended Questions for Your Doctor or Pharmacist',
    questionsSub: 'Bring these questions to your next appointment or pharmacy consultation.',
    copyQuestions: 'Copy All Questions',
    copiedToClipboard: 'Copied to Clipboard!',
    askAiHeader: 'Ask My Prescription AI Assistant',
    askAiSub: 'Ask questions about your prescribed schedule, meal timings, or side effects.',
    askAiPlaceholder: 'e.g., Can I take Paracetamol after breakfast? What are common side effects?',
    sendQuestion: 'Send Question',
    suggestedPrompts: 'Suggested Questions:',
    aiSafetyDisclaimer:
      'Educational guide only. Never stop or alter prescribed dosages without consulting your doctor.',

    cabinetTitle: 'My Medicine Cabinet',
    cabinetSubtitle: 'Comprehensive directory of all your prescribed medications and active ingredients.',
    searchMedicines: 'Search medicines by name, purpose, or strength...',
    allCategories: 'All Categories',
    filterByTiming: 'Filter by Timing',
    historyArchiveTitle: 'Prescription Archive & History',
    historyArchiveSub: 'All simplified prescriptions and caregiver guides stored securely.',
    deletePrescriptionConfirm: 'Are you sure you want to permanently delete this prescription?',

    abbreviationsTitle: 'Medical Abbreviation Decoder',
    abbreviationsSubtitle: 'Look up doctor Latin shorthand terms (OD, BD, TDS, SOS, AC, PC, HS, etc.).',
    searchAbbreviations: 'Search shorthand term (e.g. BD, TDS, PRN, AC, PC)...',
    privacyTitle: 'Privacy & Data Rights Center',
    privacySubtitle: 'Manage your confidential medical records, export copies, or purge history.',
    purgeAllData: 'Purge All My Data Permanently',
    purgeSuccess: 'All stored prescriptions and records have been purged securely.',

    globalFooterTitle: 'Medical Prescription Simplifier — An Intelligent Patient Education & Safety System',
    globalDisclaimer:
      'Disclaimer: This application provides educational information to assist patients in understanding their prescribed medications. It does not provide medical diagnoses, alter treatments, or substitute for the clinical judgment of a licensed healthcare professional. Always consult your doctor or pharmacist regarding your medication regimen.',
    translatingMessage: 'Updating translation...',
  },

  te: {
    appName: 'మెడికల్ ప్రిస్క్రిప్షన్ సింప్లిఫైయర్',
    appSubtitle: 'సులభం • సురక్షితం • రోగుల కోసం',
    safeEducationalAssistant: 'సురక్షిత విద్యా సహాయకుడు',
    safetyBannerText: 'వైద్యుని లేదా ఫార్మసిస్ట్‌ను భర్తీ చేయదు • ఎల్లప్పుడూ వివరాలను నిర్ధారించుకోండి',
    simpleModeOn: '★ సాధారణ మోడ్: ఆన్',
    simpleModeOff: '☆ సాధారణ మోడ్',
    dashboard: 'డాష్‌బోర్డ్',
    simplifyPrescription: 'ప్రిస్క్రిప్షన్ సరళీకరించండి',
    myMedicines: 'నా మందులు',
    history: 'చరిత్ర & ఆర్కైవ్',
    safetyCenter: 'భద్రత & హెచ్చరికలు',
    abbreviations: 'వైద్య సంక్షిప్త పదాలు',
    privacyRights: 'గోప్యత & డేటా హక్కులు',
    adminTelemetry: 'సిస్టమ్ స్థితి',
    signIn: 'లాగిన్',
    myAccount: 'నా ఖాతా',
    signOut: 'లాగ్ అవుట్',
    demoMode: 'డెమో మోడ్',
    tryDemo: 'డెమో చూడండి',
    exportPdf: 'PDF గైడ్ డౌన్‌లోడ్',
    print: 'ప్రింట్ చేయండి',
    backToDashboard: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి',
    back: 'వెనుకకు',
    cancel: 'రద్దు చేయండి',
    save: 'మార్పులను సేవ్ చేయండి',
    delete: 'తొలగించండి',
    confirm: 'నిర్ధారించి కొనసాగించండి',
    edit: 'వివరాలు సవరించండి',
    close: 'మూసివేయండి',
    verified: 'నిర్ధారించబడింది',
    confidence: 'విశ్వసనీయత',
    date: 'తేదీ',
    prescriber: 'వైద్యులు',

    heroTag: 'రోగుల ఆరోగ్య అవగాహన',
    heroHeadline: 'మెడికల్ ప్రిస్క్రిప్షన్ సింప్లిఫైయర్',
    heroSubheadline: 'మీ ప్రిస్క్రిప్షన్‌ను సులభమైన తెలుగులో అర్థం చేసుకోండి.',
    heroDescription:
      'వైద్యుల చేతిరాత, కష్టమైన సంక్షిప్త పదాలు మరియు మందుల వివరాలను స్పష్టమైన దినచర్య సమయ పట్టికగా మార్చండి.',
    heroConfidenceRating: 'విశ్వసనీయత రేటింగ్',
    heroInteractionWarnings: 'పరస్పర చర్య హెచ్చరికలు',
    heroDoctorQuestions: 'వైద్యుడిని అడగవలసిన ప్రశ్నలు',
    heroLanguages: '6 ప్రాంతీయ భాషలు',
    howItWorksTitle: 'ఇది ఎలా పనిచేస్తుంది',
    howItWorksSubtitle:
      'రోగి భద్రత మరియు పారదర్శకతకు ప్రాధాన్యత ఇచ్చే 5-దశల వైద్య విధానం.',
    step1Title: '1. అప్‌లోడ్ లేదా టెక్స్ట్',
    step1Desc: 'వైద్యుని ప్రిస్క్రిప్షన్ ఫోటో, PDF లేదా టెక్స్ట్ వివరాలను నమోదు చేయండి.',
    step2Title: '2. క్లినికల్ విజన్ & రీడింగ్',
    step2Desc: 'మందుల పేర్లు, మోతాదులు మరియు సంక్షిప్తాలను సరిగ్గా గుర్తిస్తుంది.',
    step3Title: '3. భద్రతా పరిశీలన',
    step3Desc: 'ఓవర్‌ల్యాప్ మందులు, ప్రతికూల ప్రభావాలు మరియు చేతిరాత స్పష్టతను తనిఖీ చేస్తుంది.',
    step4Title: '4. సరళమైన సమయ పట్టిక',
    step4Desc: 'ఉదయం, మధ్యాహ్నం, సాయంత్రం, రాత్రి సమయాలుగా మందులను విభజిస్తుంది.',
    step5Title: '5. ప్రాంతీయ భాషలు',
    step5Desc: 'తెలుగు, హిందీ, తమిళం, కన్నడ, మలయాళం మరియు ఇంగ్లీష్ భాషలలో వేగంగా మారండి.',

    totalPrescriptions: 'మొత్తం ప్రిస్క్రిప్షన్‌లు',
    activeMedicines: 'ప్రస్తుత మందులు',
    safetyCautions: 'భద్రతా జాగ్రత్తలు',
    needsVerification: 'ధృవీకరణ అవసరం',
    quickActions: 'త్వరిత చర్యలు',
    uploadNewPrescription: 'ప్రిస్క్రిప్షన్ ఫోటో అప్‌లోడ్ చేయండి',
    manualPrescriptionEntry: 'నేరుగా వివరాలు నమోదు చేయండి',
    browseMedicineCabinet: 'మందుల పెట్టెను తెరవండి',
    exploreSafetyGuide: 'భద్రతా మార్గదర్శిని',
    searchMedicalAbbreviations: 'వైద్య సంక్షిప్త పదాల నిఘంటువు',
    loadSamplePrescription: 'నమూనా ప్రిస్క్రిప్షన్ చూడండి',
    recentPrescriptions: 'సేవ్ చేసిన ప్రిస్క్రిప్షన్‌లు',
    noPrescriptionsYet: 'ఇంకా ప్రిస్క్రిప్షన్‌లు లేవు',
    noPrescriptionsSub: 'స్పష్టమైన రోజువారీ షెడ్యూల్ కోసం మీ ప్రిస్క్రిప్షన్ ఫోటోను అప్‌లోడ్ చేయండి.',
    viewDetails: 'పూర్తి వివరాలు చూడండి',
    allClearNotice: 'అన్ని మందులు ధృవీకరించబడ్డాయి.',
    verificationRequiredNotice: 'కొన్ని వివరాలకు చేతిరాత ధృవీకరణ అవసరం.',

    uploadPrescriptionTitle: 'మీ ప్రిస్క్రిప్షన్‌ను సులభతరం చేయండి',
    uploadPrescriptionSub:
      'ప్రిస్క్రిప్షన్ ఫోటోను అప్‌లోడ్ చేయండి లేదా టైప్ చేసి స్పష్టమైన సమయ పట్టికను పొందండి.',
    tabPhotoUpload: 'ప్రిస్క్రిప్షన్ ఫోటో',
    tabPdfDocument: 'PDF డాక్యుమెంట్',
    tabPasteText: 'టెక్స్ట్ రాయండి',
    tabManualEntry: 'మాన్యువల్ ఫారమ్',
    dragDropImage: 'ప్రిస్క్రిప్షన్ చిత్రాన్ని అప్‌లోడ్ చేయండి',
    dragDropSub: 'JPEG, PNG, WEBP ఫైల్స్ సపోర్ట్ చేస్తుంది (స్పష్టమైన ఫోటో మంచిది)',
    browseFiles: 'ఫైళ్లను ఎంచుకోండి',
    pastePrescriptionText: 'ప్రిస్క్రిప్షన్ టెక్స్ట్ / డాక్టర్ నోట్స్',
    pastePlaceholder: 'ఉదా: Tab Augmentin 625mg 1-0-1 x 5 రోజులు భోజనం తర్వాత\nTab Dolo 650mg జ్వరం ఉన్నప్పుడు',
    analyzePrescriptionButton: 'ప్రిస్క్రిప్షన్‌ను విశ్లేషించండి',
    analyzingPrescription: 'విశ్లేషిస్తోంది...',
    privacyNoticeUpload: '🔒 సురక్షితం & గోప్యమైనది: మీ వైద్య సమాచారం భద్రంగా ఉంటుంది.',
    cameraCapture: 'కెమెరా ఫోటో తీయండి',
    or: 'లేదా',
    prescriptionTitleLabel: 'ప్రిస్క్రిప్షన్ పేరు',
    doctorNameLabel: 'డాక్టర్ / క్లినిక్ పేరు (ఐచ్ఛికం)',
    clinicNameLabel: 'ఆసుపత్రి / క్లినిక్',
    addMedicineRow: '+ మరొక మందు జోడించండి',
    medicineName: 'మందు పేరు',
    dosage: 'మోతాదు',
    strength: 'సామర్థ్యం (ఉదా: 500mg)',
    frequency: 'ఫ్రీక్వెన్సీ (ఉదా: 1-0-1)',
    timing: 'రోజులో సమయం',
    duration: 'ఎన్ని రోజులు (ఉదా: 5 రోజులు)',
    instructions: 'ప్రత్యేక సూచనలు',

    verificationTitle: 'గుర్తించిన ప్రిస్క్రిప్షన్ వివరాలను తనిఖీ చేయండి',
    verificationSubtitle:
      'తుది షెడ్యూల్ రూపొందించే ముందు మందుల పేర్లు మరియు మోతాదులను నిర్ధారించండి.',
    highConfidenceBadge: 'అధిక విశ్వసనీయత (ధృవీకరించబడింది)',
    mediumConfidenceBadge: 'మధ్యస్థ విశ్వసనీయత (పరిశీలించండి)',
    lowConfidenceBadge: 'తక్కువ విశ్వసనీయత (తనిఖీ చేయండి)',
    clarityNoticeHigh: 'చేతిరాత స్పష్టంగా గుర్తించబడింది.',
    clarityNoticeMedium: 'చేతిరాత కొద్దిగా అస్పష్టంగా ఉంది. మోతాదును నిర్ధారించండి.',
    clarityNoticeLow: 'చేతిరాత అస్పష్టంగా ఉంది. దయచేసి అసలు ప్రిస్క్రిప్షన్‌తో సరిచూసుకోండి.',
    confirmAndProceed: 'అన్ని వివరాలను నిర్ధారించండి',
    editMedicineDetails: 'సవరించండి',
    unclearHandwritingAlert: 'అస్పష్ట చేతిరాత హెచ్చరిక: అసలు ప్రిస్క్రిప్షన్‌ను తనిఖీ చేయండి.',

    tabDailyTimeline: '1. రోజువారీ సమయ పట్టిక',
    tabMedicineCards: '2. మందుల కార్డులు',
    tabSideEffects: '3. దుష్ప్రభావాలు',
    tabInteractions: '4. పరస్పర చర్యలు & డూప్లికేట్లు',
    tabSafetyCenter: '5. భద్రతా కేంద్రం',
    tabDoctorQuestions: '6. డాక్టర్‌ని అడగవలసిన ప్రశ్నలు',
    tabAskAi: '7. AI సహాయకుడు',
    tabCompareMeds: '8. మందుల పోలిక',
    tabSummaryReport: '9. సారాంశ నివేదిక',

    morningTiming: 'ఉదయం',
    morningSub: 'అల్పాహారం / 7:00 AM – 9:00 AM',
    afternoonTiming: 'మధ్యాహ్నం',
    afternoonSub: 'భోజనం / 12:00 PM – 2:00 PM',
    eveningTiming: 'సాయంత్రం',
    eveningSub: 'రాత్రి భోజనం / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'పడుకునే ముందు',
    bedtimeSub: 'నిద్రపోయే ముందు / 9:30 PM – 11:00 PM',
    asNeededTiming: 'అవసరమైనప్పుడు (SOS)',
    asNeededSub: 'లక్షణాలు ఉన్నప్పుడు మాత్రమే వాడాలి',
    unclearTiming: 'వైద్యునితో నిర్ధారించవలసిన సమయం',
    beforeFood: 'ఆహారానికి ముందు',
    withFood: 'ఆహారంతో లేదా భోజనం తర్వాత',
    afterFood: 'భోజనం తర్వాత',
    emptyStomach: 'ఖాళీ కడుపుతో',
    noMedicinesScheduled: 'ఈ సమయానికి మందులు ఏవీ షెడ్యూల్ చేయబడలేదు.',

    genericName: 'జెనెరిక్ సాల్ట్ పేరు',
    brandName: 'బ్రాండ్ పేరు',
    route: 'రూట్ / తీసుకునే విధానం',
    purposeAndUses: 'ప్రధాన ఉపయోగాలు',
    howItWorks: 'ఈ మందు ఎలా పనిచేస్తుంది (సులభంగా)',
    administrationTips: 'ఎలా తీసుకోవాలి',
    missedDose: 'డోస్ మరచిపోతే ఏమి చేయాలి',
    storageInfo: 'నిల్వ ఉంచే విధానం',
    commonSideEffects: 'సాధారణ తేలికపాటి దుష్ప్రభావాలు',
    urgentSideEffects: 'ముఖ్యమైన లక్షణాలు (వైద్యుని సంప్రదించండి)',
    precautions: 'భద్రతా జాగ్రత్తలు',

    drugInteractionAlert: 'మందుల పరస్పర చర్య హెచ్చరిక',
    duplicateIngredientAlert: 'ఒకే రకమైన క్రియాశీల పదార్ధం గుర్తించబడింది',
    safetyScore: 'భద్రతా స్కోరు',
    recommendation: 'వైద్య సిఫార్సు',
    actionRequired: 'రోగి చేయవలసిన చర్య',
    noInteractionsDetected: 'ఎలాంటి హానికరమైన పరస్పర చర్యలు కనుగొనబడలేదు.',
    noDuplicatesDetected: 'డూప్లికేట్ క్రియాశీల పదార్థాలు లేవు.',

    questionsHeader: 'వైద్యులు లేదా ఫార్మసిస్ట్‌ను అడగవలసిన ప్రశ్నలు',
    questionsSub: 'మీ తదుపరి సంప్రదింపుల్లో ఈ ప్రశ్నలను అడగండి.',
    copyQuestions: 'అన్ని ప్రశ్నలను కాపీ చేయండి',
    copiedToClipboard: 'కాపీ చేయబడింది!',
    askAiHeader: 'ప్రిస్క్రిప్షన్ AI అసిస్టెంట్',
    askAiSub: 'మందుల వేళలు, భోజన సమయాలు లేదా దుష్ప్రభావాల గురించి ప్రశ్నలు అడగండి.',
    askAiPlaceholder: 'ఉదా: పారాసిటమాల్ భోజనం తర్వాత తీసుకోవచ్చా?',
    sendQuestion: 'ప్రశ్న పంపండి',
    suggestedPrompts: 'సూచించిన ప్రశ్నలు:',
    aiSafetyDisclaimer:
      'విద్యా ప్రయోజనాల కొరకు మాత్రమే. వైద్యుడిని సంప్రదించకుండా మోతాదులను మార్చవద్దు.',

    cabinetTitle: 'నా మందుల పెట్టె',
    cabinetSubtitle: 'మీరు తీసుకుంటున్న అన్ని మందులు మరియు పదార్థాల సమగ్ర వివరాలు.',
    searchMedicines: 'మందుల పేరు, ఉపయోగం ద్వారా వెతకండి...',
    allCategories: 'అన్ని వర్గాలు',
    filterByTiming: 'సమయం ప్రకారం ఫిల్టర్ చేయండి',
    historyArchiveTitle: 'ప్రిస్క్రిప్షన్ చరిత్ర & ఆర్కైవ్',
    historyArchiveSub: 'సురక్షితంగా నిల్వ చేయబడిన అన్ని ప్రిస్క్రిప్షన్‌లు.',
    deletePrescriptionConfirm: 'ఈ ప్రిస్క్రిప్షన్‌ను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?',

    abbreviationsTitle: 'వైద్య సంక్షిప్త పదాల డీకోడర్',
    abbreviationsSubtitle: 'వైద్యుల లాటిన్ సంక్షిప్త పదాల అర్థాలు (OD, BD, TDS, SOS, AC, PC, HS మొదలైనవి).',
    searchAbbreviations: 'సంక్షిప్త పదాన్ని వెతకండి (ఉదా: BD, TDS, PRN, AC, PC)...',
    privacyTitle: 'గోప్యత & డేటా హక్కుల కేంద్రం',
    privacySubtitle: 'మీ వైద్య రికార్డులను నిర్వహించండి లేదా తొలగించండి.',
    purgeAllData: 'నా డేటా మొత్తాన్ని శాశ్వతంగా తొలగించండి',
    purgeSuccess: 'అన్ని నిల్వ చేసిన ప్రిస్క్రిప్షన్‌లు సురక్షితంగా తొలగించబడ్డాయి.',

    globalFooterTitle: 'మెడికల్ ప్రిస్క్రిప్షన్ సింప్లిఫైయర్ — రోగుల అవగాహన & భద్రతా వ్యవస్థ',
    globalDisclaimer:
      'గమనిక: ఈ అప్లికేషన్ రోగులకు మందులను అర్థం చేసుకోవడానికి విద్యా సమాచారాన్ని అందిస్తుంది. ఇది వైద్య నిర్ధారణలను అందించదు లేదా వైద్యుల సలహాను భర్తీ చేయదు. మందుల వాడకానికి సంబంధించి ఎల్లప్పుడూ మీ వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి.',
    translatingMessage: 'అనువదిస్తోంది...',
  },

  hi: {
    appName: 'मेडिकल प्रिस्क्रिप्शन सिम्पलीफायर',
    appSubtitle: 'सरल • सुरक्षित • रोगी-अनुकूल',
    safeEducationalAssistant: 'सुरक्षित शैक्षिक सहायक',
    safetyBannerText: 'डॉक्टर या फार्मासिस्ट का विकल्प नहीं है • हमेशा पर्चे के विवरण की पुष्टि करें',
    simpleModeOn: '★ सरल मोड: चालू',
    simpleModeOff: '☆ सरल मोड',
    dashboard: 'डैशबोर्ड',
    simplifyPrescription: 'पर्चा सरल बनाएं',
    myMedicines: 'मेरी दवाइयां',
    history: 'इतिहास और संग्रह',
    safetyCenter: 'सुरक्षा और चेतावनियां',
    abbreviations: 'चिकित्सा संक्षिप्त रूप',
    privacyRights: 'गोपनीयता और डेटा अधिकार',
    adminTelemetry: 'सिस्टम स्थिति',
    signIn: 'लॉग इन',
    myAccount: 'मेरा खाता',
    signOut: 'लॉग आउट',
    demoMode: 'डेमो मोड',
    tryDemo: 'डेमो देखें',
    exportPdf: 'PDF गाइड डाउनलोड करें',
    print: 'प्रिंट करें',
    backToDashboard: 'डैशबोर्ड पर वापस जाएं',
    back: 'पीछे',
    cancel: 'रद्द करें',
    save: 'परिवर्तन सहेजें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें और जारी रखें',
    edit: 'विवरण संपादित करें',
    close: 'बंद करें',
    verified: 'सत्यापित',
    confidence: 'विश्वसनीयता',
    date: 'दिनांक',
    prescriber: 'डॉक्टर',

    heroTag: 'रोगी स्वास्थ्य सशक्तिकरण',
    heroHeadline: 'मेडिकल प्रिस्क्रिप्शन सिम्पलीफायर',
    heroSubheadline: 'अपने पर्चे को सरल हिंदी में समझें।',
    heroDescription:
      'डॉक्टर की लिखावट, कठिन संक्षिप्त रूपों और जटिल दवाओं को स्पष्ट और व्यवस्थित दैनिक समय सारिणी में बदलें।',
    heroConfidenceRating: 'विश्वसनीयता रेटिंग',
    heroInteractionWarnings: 'परस्पर क्रिया चेतावनी',
    heroDoctorQuestions: 'डॉक्टर से पूछने योग्य प्रश्न',
    heroLanguages: '6 क्षेत्रीय भाषाएं',
    howItWorksTitle: 'यह कैसे काम करता है',
    howItWorksSubtitle:
      'रोगी सुरक्षा और पारदर्शिता को प्राथमिकता देने वाली 5-चरणीय प्रक्रिया।',
    step1Title: '1. अपलोड या टेक्स्ट',
    step1Desc: 'डॉक्टर के पर्चे का फोटो, PDF या टेक्स्ट दर्ज करें।',
    step2Title: '2. विज़न और ओसीआर',
    step2Desc: 'दवाओं के नाम, खुराक और संक्षिप्त रूपों को सटीकता से पहचानता है।',
    step3Title: '3. सुरक्षा सत्यापन',
    step3Desc: 'दवाओं के टकराव, दोहराव और लिखावट की स्पष्टता की जांच करता है।',
    step4Title: '4. दैनिक समय सारिणी',
    step4Desc: 'दवाओं को सुबह, दोपहर, शाम और रात के समय में व्यवस्थित करता है।',
    step5Title: '5. बहुभाषी सुविधा',
    step5Desc: 'हिंदी, तेलुगु, तमिल, कन्नड़, मलयालम और अंग्रेजी में तुरंत बदलें।',

    totalPrescriptions: 'कुल पर्चे',
    activeMedicines: 'सक्रिय दवाएं',
    safetyCautions: 'सुरक्षा चेतावनियां',
    needsVerification: 'सत्यापन आवश्यक',
    quickActions: 'त्वरित कार्य',
    uploadNewPrescription: 'पर्चे का फोटो अपलोड करें',
    manualPrescriptionEntry: 'सीधे विवरण दर्ज करें',
    browseMedicineCabinet: 'दवा कैबिनेट खोलें',
    exploreSafetyGuide: 'सुरक्षा मार्गदर्शिका',
    searchMedicalAbbreviations: 'चिकित्सा संक्षिप्त रूप खोजें',
    loadSamplePrescription: 'नमूना पर्चा लोड करें',
    recentPrescriptions: 'सहेजे गए पर्चे',
    noPrescriptionsYet: 'अभी तक कोई पर्चा नहीं है',
    noPrescriptionsSub: 'स्पष्ट दैनिक समय सारिणी बनाने के लिए अपने पर्चे का फोटो अपलोड करें।',
    viewDetails: 'पूरा विवरण देखें',
    allClearNotice: 'सभी दवाएं जांची और सत्यापित की गई हैं।',
    verificationRequiredNotice: 'कुछ मदों के लिए लिखावट सत्यापन आवश्यक है।',

    uploadPrescriptionTitle: 'अपना पर्चा सरल बनाएं',
    uploadPrescriptionSub:
      'पर्चे की फोटो अपलोड करें या टाइप करके स्पष्ट समय सारिणी प्राप्त करें।',
    tabPhotoUpload: 'पर्चे का फोटो',
    tabPdfDocument: 'PDF दस्तावेज़',
    tabPasteText: 'टेक्स्ट लिखें',
    tabManualEntry: 'मैन्युअल फॉर्म',
    dragDropImage: 'पर्चे की छवि अपलोड करें',
    dragDropSub: 'JPEG, PNG, WEBP समर्थित (साफ फोटो सबसे अच्छा काम करता है)',
    browseFiles: 'फ़ाइलें चुनें',
    pastePrescriptionText: 'पर्चे का टेक्स्ट / डॉक्टर के नोट्स',
    pastePlaceholder: 'उदा: Tab Augmentin 625mg 1-0-1 x 5 दिन खाने के बाद\nTab Dolo 650mg बुखार होने पर',
    analyzePrescriptionButton: 'पर्चे का विश्लेषण करें',
    analyzingPrescription: 'विश्लेषण हो रहा है...',
    privacyNoticeUpload: '🔒 सुरक्षित और गोपनीय: आपका डेटा पूरी तरह सुरक्षित है।',
    cameraCapture: 'कैमरा से फोटो लें',
    or: 'या',
    prescriptionTitleLabel: 'पर्चे का शीर्षक',
    doctorNameLabel: 'डॉक्टर / क्लिनिक का नाम (वैकल्पिक)',
    clinicNameLabel: 'अस्पताल / क्लिनिक',
    addMedicineRow: '+ अन्य दवा जोड़ें',
    medicineName: 'दवा का नाम',
    dosage: 'खुराक',
    strength: 'क्षमता (उदा: 500mg)',
    frequency: 'आवृत्ति (उदा: 1-0-1)',
    timing: 'दिन का समय',
    duration: 'अवधि (उदा: 5 दिन)',
    instructions: 'विशेष निर्देश',

    verificationTitle: 'निकाले गए विवरण की पुष्टि करें',
    verificationSubtitle:
      'अंतिम समय सारिणी से पहले दवा के नाम और खुराक की पुष्टि करें।',
    highConfidenceBadge: 'उच्च विश्वसनीयता (सत्यापित)',
    mediumConfidenceBadge: 'मध्यम विश्वसनीयता (जांचें)',
    lowConfidenceBadge: 'कम विश्वसनीयता (कृपया पुष्टि करें)',
    clarityNoticeHigh: 'साफ लिखावट पहचानी गई।',
    clarityNoticeMedium: 'लिखावट थोड़ी अस्पष्ट थी। कृपया खुराक की पुष्टि करें।',
    clarityNoticeLow: 'लिखावट अस्पष्ट थी। कृपया मूल पर्चे से जांच करें।',
    confirmAndProceed: 'सभी विवरणों की पुष्टि करें',
    editMedicineDetails: 'संपादित करें',
    unclearHandwritingAlert: 'अस्पष्ट लिखावट चेतावनी: मूल पर्चे की जांच करें।',

    tabDailyTimeline: '1. दैनिक समय सारिणी',
    tabMedicineCards: '2. दवा कार्ड',
    tabSideEffects: '3. दुष्प्रभाव',
    tabInteractions: '4. परस्पर क्रिया और दोहराव',
    tabSafetyCenter: '5. सुरक्षा केंद्र',
    tabDoctorQuestions: '6. डॉक्टर से पूछने योग्य प्रश्न',
    tabAskAi: '7. AI सहायक',
    tabCompareMeds: '8. दवाओं की तुलना',
    tabSummaryReport: '9. सारांश रिपोर्ट',

    morningTiming: 'सुबह',
    morningSub: 'नाश्ता / 7:00 AM – 9:00 AM',
    afternoonTiming: 'दोपहर',
    afternoonSub: 'दोपहर का भोजन / 12:00 PM – 2:00 PM',
    eveningTiming: 'शाम',
    eveningSub: 'रात का खाना / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'सोने से पहले',
    bedtimeSub: 'रात को सोने से पहले / 9:30 PM – 11:00 PM',
    asNeededTiming: 'जरूरत पड़ने पर (SOS)',
    asNeededSub: 'केवल लक्षण होने पर लें',
    unclearTiming: 'डॉक्टर से पुष्टि करने योग्य समय',
    beforeFood: 'खाने से पहले',
    withFood: 'खाने के साथ या बाद में',
    afterFood: 'खाने के बाद',
    emptyStomach: 'खाली पेट',
    noMedicinesScheduled: 'इस समय के लिए कोई दवा निर्धारित नहीं है।',

    genericName: 'जेनेरिक नाम',
    brandName: 'ब्रांड नाम',
    route: 'लेने का तरीका',
    purposeAndUses: 'मुख्य उपयोग',
    howItWorks: 'यह दवा कैसे काम करती है (सरल भाषा में)',
    administrationTips: 'दवा लेने का सही तरीका',
    missedDose: 'खुराक छूट जाने पर क्या करें',
    storageInfo: 'दवा रखने का स्थान',
    commonSideEffects: 'सामान्य हल्के दुष्प्रभाव',
    urgentSideEffects: 'गंभीर लक्षण (तुरंत डॉक्टर से संपर्क करें)',
    precautions: 'सुरक्षा सावधानियां',

    drugInteractionAlert: 'दवाओं के टकराव की चेतावनी',
    duplicateIngredientAlert: 'समान सक्रिय घटक पाया गया',
    safetyScore: 'सुरक्षा स्कोर',
    recommendation: 'चिकित्सीय सलाह',
    actionRequired: 'रोगी के लिए निर्देश',
    noInteractionsDetected: 'वर्तमान दवाओं में कोई हानिकारक टकराव नहीं मिला।',
    noDuplicatesDetected: 'कोई दोहराया गया सक्रिय घटक नहीं मिला।',

    questionsHeader: 'डॉक्टर या फार्मासिस्ट से पूछने योग्य प्रश्न',
    questionsSub: 'अगली मुलाकात में ये प्रश्न अवश्य पूछें।',
    copyQuestions: 'सभी प्रश्न कॉपी करें',
    copiedToClipboard: 'कॉपी कर लिया गया!',
    askAiHeader: 'प्रिस्क्रिप्शन AI सहायक',
    askAiSub: 'दवाओं के समय, भोजन या दुष्प्रभावों के बारे में पूछें।',
    askAiPlaceholder: 'उदा: क्या मैं पेरासिटामोल खाने के बाद ले सकता हूँ?',
    sendQuestion: 'प्रश्न भेजें',
    suggestedPrompts: 'सुझाए गए प्रश्न:',
    aiSafetyDisclaimer:
      'केवल शैक्षिक मार्गदर्शन के लिए। डॉक्टर की सलाह के बिना खुराक न बदलें।',

    cabinetTitle: 'मेरी दवा कैबिनेट',
    cabinetSubtitle: 'आपकी सभी दवाओं और सक्रिय घटकों की पूरी सूची।',
    searchMedicines: 'दवा के नाम या उपयोग से खोजें...',
    allCategories: 'सभी श्रेणियां',
    filterByTiming: 'समय के अनुसार फ़िल्टर करें',
    historyArchiveTitle: 'पर्चा इतिहास और संग्रह',
    historyArchiveSub: 'सुरक्षित रूप से सहेजे गए सभी पर्चे।',
    deletePrescriptionConfirm: 'क्या आप इस पर्चे को स्थायी रूप से हटाना चाहते हैं?',

    abbreviationsTitle: 'चिकित्सा संक्षिप्त रूप डिकोडर',
    abbreviationsSubtitle: 'डॉक्टर के लैटिन संक्षिप्त रूपों के अर्थ (OD, BD, TDS, SOS, AC, PC, आदि)।',
    searchAbbreviations: 'संक्षिप्त रूप खोजें (उदा: BD, TDS, PRN, AC, PC)...',
    privacyTitle: 'गोपनीयता और डेटा अधिकार',
    privacySubtitle: 'अपने रिकॉर्ड प्रबंधित करें या हटाएं।',
    purgeAllData: 'मेरा सारा डेटा स्थायी रूप से हटाएं',
    purgeSuccess: 'सभी सहेजे गए पर्चे सुरक्षित रूप से हटा दिए गए हैं।',

    globalFooterTitle: 'मेडिकल प्रिस्क्रिप्शन सिम्पलीफायर — रोगी शिक्षा और सुरक्षा प्रणाली',
    globalDisclaimer:
      'अस्वीकरण: यह एप्लिकेशन रोगियों को दवा समझने में सहायता के लिए शैक्षिक जानकारी प्रदान करता है। यह चिकित्सा निदान या डॉक्टर के निर्णय का विकल्प नहीं है। दवा के संबंध में हमेशा अपने डॉक्टर या फार्मासिस्ट से परामर्श लें।',
    translatingMessage: 'अनुवाद हो रहा है...',
  },

  ta: {
    appName: 'மருத்துவ மருந்துச்சீட்டு எளிதாக்கி',
    appSubtitle: 'தெளிவான • பாதுகாப்பான • நோயாளிக்கு ஏற்றது',
    safeEducationalAssistant: 'பாதுகாப்பான கல்வி உதவியாளர்',
    safetyBannerText: 'மருத்துவர் அல்லது மருந்தாளுநரின் ஆலோசனையை மாற்றாது • எப்போதும் விவரங்களை உறுதிப்படுத்தவும்',
    simpleModeOn: '★ எளிய முறை: ஆன்',
    simpleModeOff: '☆ எளிய முறை',
    dashboard: 'முகப்புப் பலகை',
    simplifyPrescription: 'மருந்துச்சீட்டை எளிதாக்கு',
    myMedicines: 'எனது மருந்துகள்',
    history: 'வரலாறு & காப்பகம்',
    safetyCenter: 'பாதுகாப்பு & எச்சரிக்கைகள்',
    abbreviations: 'மருத்துவச் சுருக்கங்கள்',
    privacyRights: 'தனியுரிமை & தரவு உரிமைகள்',
    adminTelemetry: 'கணினி நிலை',
    signIn: 'உள்நுழைக',
    myAccount: 'எனது கணக்கு',
    signOut: 'வெளியேறு',
    demoMode: 'டெமோ முறை',
    tryDemo: 'டெமோ பார்க்க',
    exportPdf: 'PDF வழிகாட்டியைப் பதிவிறக்கு',
    print: 'அச்சிடுக',
    backToDashboard: 'முகப்புக்குத் திரும்பு',
    back: 'பின்செல்',
    cancel: 'ரத்துசெய்',
    save: 'மாற்றங்களைச் சேமி',
    delete: 'நீக்கு',
    confirm: 'உறுதிசெய்து தொடர்க',
    edit: 'விவரங்களைத் திருத்து',
    close: 'மூடு',
    verified: 'சரிபார்க்கப்பட்டது',
    confidence: 'நம்பகத்தன்மை',
    date: 'தேதி',
    prescriber: 'மருத்துவர்',

    heroTag: 'நோயாளி நல்வாழ்வு வழிகாட்டி',
    heroHeadline: 'மருத்துவ மருந்துச்சீட்டு எளிதாக்கி',
    heroSubheadline: 'உங்கள் மருந்துச்சீட்டை எளிய தமிழில் புரிந்துகொள்ளுங்கள்.',
    heroDescription:
      'மருத்துவரின் கையெழுத்து, கடினமான சுருக்கங்கள் மற்றும் மருந்துகளைத் தெளிவான தினசரி அட்டவணையாக மாற்றவும்.',
    heroConfidenceRating: 'நம்பகத்தன்மை மதிப்பீடு',
    heroInteractionWarnings: 'மருந்து எதிர்வினை எச்சரிக்கைகள்',
    heroDoctorQuestions: 'மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள்',
    heroLanguages: '6 பிராந்திய மொழிகள்',
    howItWorksTitle: 'இது எவ்வாறு செயல்படுகிறது',
    howItWorksSubtitle: 'நோயாளி பாதுகாப்பிற்கு முன்னுரிமை அளிக்கும் 5-படி மருத்துவ முறை.',
    step1Title: '1. பதிவேற்றவும்',
    step1Desc: 'மருந்துச்சீட்டு படம், PDF அல்லது உரையைப் பதிவு செய்யவும்.',
    step2Title: '2. விஷன் & வாசிப்பு',
    step2Desc: 'மருந்துகளின் பெயர்கள் மற்றும் அளவுகளைத் துல்லியமாகக் கண்டறியும்.',
    step3Title: '3. பாதுகாப்புச் சரிபார்ப்பு',
    step3Desc: 'மருந்துகளின் முரண்பாடுகள் மற்றும் கையெழுத்துத் தெளிவைச் சரிபார்க்கிறது.',
    step4Title: '4. தினசரி அட்டவணை',
    step4Desc: 'காலை, மதியம், மாலை மற்றும் இரவு நேரங்களாகப் பிரிக்கிறது.',
    step5Title: '5. பல மொழிகள்',
    step5Desc: 'தமிழ், தெலுங்கு, இந்தி, கன்னடம், மலையாளம் மற்றும் ஆங்கிலத்தில் உடனே மாறலாம்.',

    totalPrescriptions: 'மொத்த மருந்துச்சீட்டுகள்',
    activeMedicines: 'தற்போதைய மருந்துகள்',
    safetyCautions: 'பாதுகாப்பு எச்சரிக்கைகள்',
    needsVerification: 'சரிபார்ப்பு தேவை',
    quickActions: 'விரைவுச் செயல்கள்',
    uploadNewPrescription: 'மருந்துச்சீட்டு படத்தை பதிவேற்றவும்',
    manualPrescriptionEntry: 'விவரங்களை நேரடியாக உள்ளிடவும்',
    browseMedicineCabinet: 'மருந்துப் பெட்டியைத் திறக்கவும்',
    exploreSafetyGuide: 'பாதுகாப்பு வழிகாட்டி',
    searchMedicalAbbreviations: 'மருத்துவச் சுருக்கங்களைத் தேடுங்கள்',
    loadSamplePrescription: 'மாதிரி மருந்துச்சீட்டைப் பார்க்க',
    recentPrescriptions: 'சேமிக்கப்பட்ட மருந்துச்சீட்டுகள்',
    noPrescriptionsYet: 'மருந்துச்சீட்டுகள் எதுவும் இல்லை',
    noPrescriptionsSub: 'தினசரி அட்டவணையை உருவாக்க உங்கள் மருந்துச்சீட்டைப் பதிவேற்றவும்.',
    viewDetails: 'முழு விவரங்களைப் பார்க்க',
    allClearNotice: 'அனைத்து மருந்துகளும் சரிபார்க்கப்பட்டன.',
    verificationRequiredNotice: 'சில விவரங்களுக்குக் கையெழுத்துச் சரிபார்ப்பு தேவை.',

    uploadPrescriptionTitle: 'மருந்துச்சீட்டை எளிதாக்குங்கள்',
    uploadPrescriptionSub: 'படத்தைப் பதிவேற்றி தெளிவான அட்டவணையைப் பெறுங்கள்.',
    tabPhotoUpload: 'மருந்துச்சீட்டு படம்',
    tabPdfDocument: 'PDF ஆவணம்',
    tabPasteText: 'உரையை எழுதுங்கள்',
    tabManualEntry: 'படிவம்',
    dragDropImage: 'மருந்துச்சீட்டு படத்தை இழுத்துப் போடுங்கள்',
    dragDropSub: 'JPEG, PNG, WEBP ஆதரிக்கப்படுகிறது',
    browseFiles: 'கோப்புகளைத் தேர்வுசெய்க',
    pastePrescriptionText: 'மருந்துச்சீட்டு உரை',
    pastePlaceholder: 'எ.கா: Tab Augmentin 625mg 1-0-1 x 5 நாட்கள் உணவுக்குப் பின்',
    analyzePrescriptionButton: 'மருந்துச்சீட்டை ஆய்வு செய்க',
    analyzingPrescription: 'ஆய்வு செய்யப்படுகிறது...',
    privacyNoticeUpload: '🔒 பாதுகாப்பானது: உங்கள் தரவு முழுமையாகப் பாதுகாக்கப்படுகிறது.',
    cameraCapture: 'புகைப்படம் எடுக்கவும்',
    or: 'அல்லது',
    prescriptionTitleLabel: 'தலைப்பு',
    doctorNameLabel: 'மருத்துவர் / மருத்துவமனை பெயர்',
    clinicNameLabel: 'மருத்துவமனை',
    addMedicineRow: '+ அடுத்த மருந்தைச் சேர்க்கவும்',
    medicineName: 'மருந்தின் பெயர்',
    dosage: 'அளவு',
    strength: 'வீரியம் (எ.கா: 500mg)',
    frequency: 'அலைவரிசை (எ.கா: 1-0-1)',
    timing: 'எடுத்துக்கொள்ளும் நேரம்',
    duration: 'கால அளவு (எ.கா: 5 நாட்கள்)',
    instructions: 'சிறப்புக் குறிப்புகள்',

    verificationTitle: 'கண்டறியப்பட்ட விவரங்களைச் சரிபார்க்கவும்',
    verificationSubtitle: 'அட்டவணைக்கு முன் மருந்துகளின் பெயர்களை உறுதிப்படுத்தவும்.',
    highConfidenceBadge: 'உயர் நம்பகத்தன்மை (சரிபார்க்கப்பட்டது)',
    mediumConfidenceBadge: 'நடுத்தர நம்பகத்தன்மை (சரிபார்க்கவும்)',
    lowConfidenceBadge: 'குறைந்த நம்பகத்தன்மை (தயவுசெய்து உறுதிப்படுத்தவும்)',
    clarityNoticeHigh: 'தெளிவான கையெழுத்து கண்டறியப்பட்டது.',
    clarityNoticeMedium: 'கையெழுத்து சற்று தெளிவற்றது. அளவை உறுதிப்படுத்தவும்.',
    clarityNoticeLow: 'கையெழுத்து தெளிவாக இல்லை. மூல ஆவணத்தை சரிபார்க்கவும்.',
    confirmAndProceed: 'அனைத்து விவரங்களையும் உறுதிசெய்க',
    editMedicineDetails: 'திருத்துக',
    unclearHandwritingAlert: 'தெளிவற்ற கையெழுத்து எச்சரிக்கை: மூல ஆவணத்தைச் சரிபார்க்கவும்.',

    tabDailyTimeline: '1. தினசரி அட்டவணை',
    tabMedicineCards: '2. மருந்து அட்டைகள்',
    tabSideEffects: '3. பக்கவிளைவுகள்',
    tabInteractions: '4. மருந்து முரண்பாடுகள்',
    tabSafetyCenter: '5. பாதுகாப்பு மையம்',
    tabDoctorQuestions: '6. மருத்துவரிடம் கேட்க வேண்டியவை',
    tabAskAi: '7. AI உதவியாளர்',
    tabCompareMeds: '8. மருந்து ஒப்பீடு',
    tabSummaryReport: '9. சுருக்க அறிக்கை',

    morningTiming: 'காலை',
    morningSub: 'காலை உணவு / 7:00 AM – 9:00 AM',
    afternoonTiming: 'மதியம்',
    afternoonSub: 'மதிய உணவு / 12:00 PM – 2:00 PM',
    eveningTiming: 'மாலை',
    eveningSub: 'இரவு உணவு / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'இரவு உறங்கும் முன்',
    bedtimeSub: 'உறங்குவதற்கு முன் / 9:30 PM – 11:00 PM',
    asNeededTiming: 'தேவைப்படும் போது (SOS)',
    asNeededSub: 'அறிகுறிகள் இருக்கும்போது மட்டும்',
    unclearTiming: 'மருத்துவரிடம் உறுதிப்படுத்த வேண்டிய நேரம்',
    beforeFood: 'உணவுக்கு முன்',
    withFood: 'உணவுடன் அல்லது உணவுக்குப் பின்',
    afterFood: 'உணவுக்குப் பின்',
    emptyStomach: 'வெறும் வயிற்றில்',
    noMedicinesScheduled: 'இந்த நேரத்திற்கு மருந்துகள் எதுவும் இல்லை.',

    genericName: 'ஜெனரிக் பெயர்',
    brandName: 'பிராண்ட் பெயர்',
    route: 'உட்கொள்ளும் முறை',
    purposeAndUses: 'முக்கிய பயன்கள்',
    howItWorks: 'மருந்து எவ்வாறு செயல்படுகிறது',
    administrationTips: 'சரியாக உட்கொள்ளும் முறை',
    missedDose: 'மருந்தை தவறவிட்டால் என்ன செய்ய வேண்டும்',
    storageInfo: 'சேமித்து வைக்கும் முறை',
    commonSideEffects: 'பொதுவான பக்கவிளைவுகள்',
    urgentSideEffects: 'முக்கிய அறிகுறிகள் (மருத்துவரை அணுகவும்)',
    precautions: 'பாதுகாப்பு முன்னெச்சரிக்கைகள்',

    drugInteractionAlert: 'மருந்து எதிர்வினை எச்சரிக்கை',
    duplicateIngredientAlert: 'ஒரே மூலப்பொருள் மீண்டும் கண்டறியப்பட்டது',
    safetyScore: 'பாதுகாப்பு மதிப்பீடு',
    recommendation: 'மருத்துவ பரிந்துரை',
    actionRequired: 'நோயாளி செய்ய வேண்டியது',
    noInteractionsDetected: 'தீங்கு விளைவிக்கும் எதிர்வினைகள் எதுவும் இல்லை.',
    noDuplicatesDetected: 'மீண்டும் மீண்டும் வரும் மூலப்பொருட்கள் இல்லை.',

    questionsHeader: 'மருத்துவரிடம் கேட்க வேண்டிய கேள்விகள்',
    questionsSub: 'அடுத்த சந்திப்பில் இந்த கேள்விகளைக் கேட்கவும்.',
    copyQuestions: 'அனைத்து கேள்விகளையும் நகலெடு',
    copiedToClipboard: 'நகலெடுக்கப்பட்டது!',
    askAiHeader: 'AI உதவியாளர்',
    askAiSub: 'மருந்துகள் மற்றும் நேரம் பற்றிய கேள்விகளைக் கேளுங்கள்.',
    askAiPlaceholder: 'எ.கா: உணவுக்குப் பின் இந்த மருந்தை எடுத்துக்கொள்ளலாமா?',
    sendQuestion: 'கேள்வியை அனுப்புக',
    suggestedPrompts: 'பரிந்துரைக்கப்பட்ட கேள்விகள்:',
    aiSafetyDisclaimer: 'கல்வி வழிகாட்டுதலுக்கு மட்டுமே. மருத்துவ ஆலோசனை இல்லாமல் அளவை மாற்ற வேண்டாம்.',

    cabinetTitle: 'எனது மருந்துப் பெட்டி',
    cabinetSubtitle: 'உங்கள் அனைத்து மருந்துகளின் முழு விவரங்கள்.',
    searchMedicines: 'மருந்தின் பெயர் மூலம் தேடவும்...',
    allCategories: 'அனைத்துப் பிரிவுகளும்',
    filterByTiming: 'நேரத்தின்படி வடிகட்டவும்',
    historyArchiveTitle: 'மருந்துச்சீட்டு வரலாறு',
    historyArchiveSub: 'சேமிக்கப்பட்ட அனைத்து மருந்துச்சீட்டுகளும்.',
    deletePrescriptionConfirm: 'இந்த மருந்துச்சீட்டை நிச்சயமாக நீக்க விரும்புகிறீர்களா?',

    abbreviationsTitle: 'மருத்துவச் சுருக்க விளக்கம்',
    abbreviationsSubtitle: 'மருத்துவரின் லத்தீன் சுருக்கங்களின் அர்த்தங்கள் (OD, BD, TDS, SOS போன்றவை).',
    searchAbbreviations: 'சுருக்கத்தைத் தேடுங்கள் (எ.கா: BD, TDS)...',
    privacyTitle: 'தனியுரிமை மையம்',
    privacySubtitle: 'உங்கள் தரவை நிர்வகிக்கவும் அல்லது நீக்கவும்.',
    purgeAllData: 'அனைத்து தரவுகளையும் நீக்கு',
    purgeSuccess: 'அனைத்து மருந்துச்சீட்டுகளும் பாதுகாப்பாக நீக்கப்பட்டன.',

    globalFooterTitle: 'மருத்துவ மருந்துச்சீட்டு எளிதாக்கி — நோயாளி கல்வி & பாதுகாப்பு அமைப்பு',
    globalDisclaimer:
      'மறுப்பு: இந்த பயன்பாடு நோயாளிகளுக்கு மருந்துகளைப் புரிந்துகொள்ள கல்வித் தகவல்களை மட்டுமே வழங்குகிறது. இது மருத்துவ நோயறிதலை வழங்காது. உங்கள் மருந்துகள் குறித்து எப்போதும் உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.',
    translatingMessage: 'மொழிபெயர்க்கப்படுகிறது...',
  },

  kn: {
    appName: 'ವೈದ್ಯಕೀಯ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸಿಂಪ್ಲಿಫೈಯರ್',
    appSubtitle: 'ಸ್ಪಷ್ಟ • ಸುರಕ್ಷಿತ • ರೋಗಿ-ಸ್ನೇಹಿ',
    safeEducationalAssistant: 'ಸುರಕ್ಷಿತ ಶೈಕ್ಷಣಿಕ ಸಹಾಯಕ',
    safetyBannerText: 'ವೈದ್ಯರ ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್ ಸಲಹೆಯನ್ನು ಬದಲಿಸುವುದಿಲ್ಲ • ವಿವರಗಳನ್ನು ಯಾವಾಗಲೂ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ',
    simpleModeOn: '★ ಸರಳ ಮೋಡ್: ಆನ್',
    simpleModeOff: '☆ ಸರಳ ಮೋಡ್',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    simplifyPrescription: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸರಳಗೊಳಿಸಿ',
    myMedicines: 'ನನ್ನ ಔಷಧಿಗಳು',
    history: 'ಇತಿಹಾಸ ಮತ್ತು ದಾಖಲೆ',
    safetyCenter: 'ಸುರಕ್ಷತೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    abbreviations: 'ವೈದ್ಯಕೀಯ ಸಂಕ್ಷಿಪ್ತ ರೂಪಗಳು',
    privacyRights: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಹಕ್ಕುಗಳು',
    adminTelemetry: 'ವ್ಯವಸ್ಥೆಯ ಸ್ಥಿತಿ',
    signIn: 'ಲಾಗಿನ್',
    myAccount: 'ನನ್ನ ಖಾತೆ',
    signOut: 'ಲಾಗ್ ಔಟ್',
    demoMode: 'ಡೆಮೊ ಮೋಡ್',
    tryDemo: 'ಡೆಮೊ ನೋಡಿ',
    exportPdf: 'PDF ಮಾರ್ಗದರ್ಶಿ ಡೌನ್‌ಲೋಡ್',
    print: 'ಮುದ್ರಿಸಿ',
    backToDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    back: 'ಹಿಂದೆ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    confirm: 'ಖಚಿತಪಡಿಸಿ ಮುಂದುವರಿಯಿರಿ',
    edit: 'ವಿವರಗಳನ್ನು ತಿದ್ದಿ',
    close: 'ಮುಚ್ಚಿ',
    verified: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    confidence: 'ವಿಶ್ವಾಸಾರ್ಹತೆ',
    date: 'ದಿನಾಂಕ',
    prescriber: 'ವೈದ್ಯರು',

    heroTag: 'ರೋಗಿಗಳ ಆರೋಗ್ಯ ಜಾಗೃತಿ',
    heroHeadline: 'ವೈದ್ಯಕೀಯ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸಿಂಪ್ಲಿಫೈಯರ್',
    heroSubheadline: 'ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    heroDescription:
      'ವೈದ್ಯರ ಕೈಬರಹ, ಕಷ್ಟಕರವಾದ ಸಂಕ್ಷಿಪ್ತ ರೂಪಗಳು ಮತ್ತು ಔಷಧಿಗಳನ್ನು ಸ್ಪಷ್ಟ ದಿನನಿತ್ಯದ ವೇಳಾಪಟ್ಟಿಯಾಗಿ ಪರಿವರ್ತಿಸಿ.',
    heroConfidenceRating: 'ವಿಶ್ವಾಸಾರ್ಹತೆ ರೇಟಿಂಗ್',
    heroInteractionWarnings: 'ಔಷಧಿ ಪರಸ್ಪರ ಕ್ರಿಯೆ ಎಚ್ಚರಿಕೆ',
    heroDoctorQuestions: 'ವೈದ್ಯರನ್ನು ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆಗಳು',
    heroLanguages: '6 ಪ್ರಾದೇಶಿಕ ಭಾಷೆಗಳು',
    howItWorksTitle: 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    howItWorksSubtitle: 'ರೋಗಿ ಸುರಕ್ಷತೆಗೆ ಆದ್ಯತೆ ನೀಡುವ 5-ಹಂತದ ವೈದ್ಯಕೀಯ ಪ್ರಕ್ರಿಯೆ.',
    step1Title: '1. ಅಪ್‌ಲೋಡ್ ಅಥವಾ ಟೆಕ್ಸ್ಟ್',
    step1Desc: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ, PDF ಅಥವಾ ಪಠ್ಯವನ್ನು ದಾಖಲಿಸಿ.',
    step2Title: '2. ವಿಷನ್ ಮತ್ತು ರೀಡಿಂಗ್',
    step2Desc: 'ಔಷಧಿ ಹೆಸರುಗಳು ಮತ್ತು ಪ್ರಮಾಣವನ್ನು ನಿಖರವಾಗಿ ಗುರುತಿಸುತ್ತದೆ.',
    step3Title: '3. ಸುರಕ್ಷತಾ ಪರಿಶೀಲನೆ',
    step3Desc: 'ಔಷಧಿಗಳ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಕೈಬರಹದ ಸ್ಪಷ್ಟತೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.',
    step4Title: '4. ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ',
    step4Desc: 'ಬೆಳಿಗ್ಗೆ, ಮಧ್ಯಾಹ್ನ, ಸಂಜೆ ಮತ್ತು ರಾತ್ರಿಯ ಸಮಯಗಳಾಗಿ ವಿಂಗಡಿಸುತ್ತದೆ.',
    step5Title: '5. ಬಹುಭಾಷಾ ಬೆಂಬಲ',
    step5Desc: 'ಕನ್ನಡ, ತೆಲುಗು, ಹಿಂದಿ, ತಮಿಳು, ಮಲಯಾಳಂ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ತಕ್ಷಣ ಬದಲಿಸಿ.',

    totalPrescriptions: 'ಒಟ್ಟು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು',
    activeMedicines: 'ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು',
    safetyCautions: 'ಸುರಕ್ಷತಾ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು',
    needsVerification: 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ',
    quickActions: 'ತ್ವರಿತ ಕ್ರಮಗಳು',
    uploadNewPrescription: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    manualPrescriptionEntry: 'ವಿವರಗಳನ್ನು ನೇರವಾಗಿ ನಮೂದಿಸಿ',
    browseMedicineCabinet: 'ಔಷಧಿ ಪೆಟ್ಟಿಗೆಯನ್ನು ತೆರೆಯಿರಿ',
    exploreSafetyGuide: 'ಸುರಕ್ಷತಾ ಮಾರ್ಗದರ್ಶಿ',
    searchMedicalAbbreviations: 'ವೈದ್ಯಕೀಯ ಸಂಕ್ಷಿಪ್ತ ರೂಪಗಳನ್ನು ಹುಡುಕಿ',
    loadSamplePrescription: 'ಮಾದರಿ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವೀಕ್ಷಿಸಿ',
    recentPrescriptions: 'ಉಳಿಸಲಾದ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು',
    noPrescriptionsYet: 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳಿಲ್ಲ',
    noPrescriptionsSub: 'ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿಯನ್ನು ರಚಿಸಲು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    viewDetails: 'ಪೂರ್ಣ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    allClearNotice: 'ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
    verificationRequiredNotice: 'ಕೆಲವು ವಿವರಗಳಿಗೆ ಕೈಬರಹ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.',

    uploadPrescriptionTitle: 'ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸರಳಗೊಳಿಸಿ',
    uploadPrescriptionSub: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಸ್ಪಷ್ಟ ವೇಳಾಪಟ್ಟಿ ಪಡೆಯಿರಿ.',
    tabPhotoUpload: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಫೋಟೋ',
    tabPdfDocument: 'PDF ದಾಖಲೆ',
    tabPasteText: 'ಪಠ್ಯ ಬರೆಯಿರಿ',
    tabManualEntry: 'ಫಾರ್ಮ್',
    dragDropImage: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    dragDropSub: 'JPEG, PNG, WEBP ಬೆಂಬಲಿತವಾಗಿದೆ',
    browseFiles: 'ಫೈಲ್‌ಗಳನ್ನು ಆರಿಸಿ',
    pastePrescriptionText: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಪಠ್ಯ',
    pastePlaceholder: 'ಉದಾ: Tab Augmentin 625mg 1-0-1 x 5 ದಿನಗಳು ಊಟದ ನಂತರ',
    analyzePrescriptionButton: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವಿಶ್ಲೇಷಿಸಿ',
    analyzingPrescription: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    privacyNoticeUpload: '🔒 ಸುರಕ್ಷಿತ ಮತ್ತು ಗೌಪ್ಯ: ನಿಮ್ಮ ಡೇಟಾ ಸಂಪೂರ್ಣ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
    cameraCapture: 'ಕ್ಯಾಮೆರಾದಿಂದ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    or: 'ಅಥವಾ',
    prescriptionTitleLabel: 'ಶೀರ್ಷಿಕೆ',
    doctorNameLabel: 'ವೈದ್ಯರು / ಕ್ಲಿನಿಕ್ ಹೆಸರು',
    clinicNameLabel: 'ಆಸ್ಪತ್ರೆ',
    addMedicineRow: '+ ಇನ್ನೊಂದು ಔಷಧಿ ಸೇರಿಸಿ',
    medicineName: 'ಔಷಧಿಯ ಹೆಸರು',
    dosage: 'ಪ್ರಮಾಣ',
    strength: 'ಸಾಮರ್ಥ್ಯ (ಉದಾ: 500mg)',
    frequency: 'ಆವರ್ತನ (ಉದಾ: 1-0-1)',
    timing: 'ಸೇವಿಸುವ ಸಮಯ',
    duration: 'ಅವಧಿ (ಉದಾ: 5 ದಿನಗಳು)',
    instructions: 'ವಿಶೇಷ ಸೂಚನೆಗಳು',

    verificationTitle: 'ಗುರುತಿಸಲಾದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    verificationSubtitle: 'ಅಂತಿಮ ವೇಳಾಪಟ್ಟಿಗೆ ಮುಂಚಿತವಾಗಿ ಔಷಧಿ ಹೆಸರುಗಳನ್ನು ಖಚಿತಪಡಿಸಿ.',
    highConfidenceBadge: 'ಉನ್ನತ ವಿಶ್ವಾಸಾರ್ಹತೆ (ದೃಢೀಕರಿಸಲಾಗಿದೆ)',
    mediumConfidenceBadge: 'ಮಧ್ಯಮ ವಿಶ್ವಾಸಾರ್ಹತೆ (ಪರಿಶೀಲಿಸಿ)',
    lowConfidenceBadge: 'ಕಡಿಮೆ ವಿಶ್ವಾಸಾರ್ಹತೆ (ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ)',
    clarityNoticeHigh: 'ಸ್ಪಷ್ಟ ಕೈಬರಹ ಗುರುತಿಸಲಾಗಿದೆ.',
    clarityNoticeMedium: 'ಕೈಬರಹ ಸ್ವಲ್ಪ ಅಸ್ಪಷ್ಟವಾಗಿದೆ. ಪ್ರಮಾಣವನ್ನು ಖಚಿತಪಡಿಸಿ.',
    clarityNoticeLow: 'ಕೈಬರಹ ಅಸ್ಪಷ್ಟವಾಗಿದೆ. ಮೂಲ ದಾಖಲೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
    confirmAndProceed: 'ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಿ',
    editMedicineDetails: 'ತಿದ್ದಿ',
    unclearHandwritingAlert: 'ಅಸ್ಪಷ್ಟ ಕೈಬರಹ ಎಚ್ಚರಿಕೆ: ಮೂಲ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.',

    tabDailyTimeline: '1. ದೈನಂದಿನ ವೇಳಾಪಟ್ಟಿ',
    tabMedicineCards: '2. ಔಷಧಿ ಕಾರ್ಡ್‌ಗಳು',
    tabSideEffects: '3. ಅಡ್ಡಪರಿಣಾಮಗಳು',
    tabInteractions: '4. ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಪುನರಾವರ್ತನೆ',
    tabSafetyCenter: '5. ಸುರಕ್ಷತಾ ಕೇಂದ್ರ',
    tabDoctorQuestions: '6. ವೈದ್ಯರನ್ನು ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆಗಳು',
    tabAskAi: '7. AI ಸಹಾಯಕ',
    tabCompareMeds: '8. ಔಷಧಿ ಹೋಲಿಕೆ',
    tabSummaryReport: '9. ಸಾರಾಂಶ ವರದಿ',

    morningTiming: 'ಬೆಳಿಗ್ಗೆ',
    morningSub: 'ಉಪಹಾರ / 7:00 AM – 9:00 AM',
    afternoonTiming: 'ಮಧ್ಯಾಹ್ನ',
    afternoonSub: 'ಊಟ / 12:00 PM – 2:00 PM',
    eveningTiming: 'ಸಂಜೆ',
    eveningSub: 'ರಾತ್ರಿ ಊಟ / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'ಮಲಗುವ ಮುನ್ನ',
    bedtimeSub: 'ನಿದ್ರೆಗೆ ಮುನ್ನ / 9:30 PM – 11:00 PM',
    asNeededTiming: 'ಅಗತ್ಯವಿದ್ದಾಗ (SOS)',
    asNeededSub: 'ರೋಗಲಕ್ಷಣಗಳಿದ್ದಾಗ ಮಾತ್ರ ಸೇವಿಸಿ',
    unclearTiming: 'ವೈದ್ಯರೊಂದಿಗೆ ಖಚಿತಪಡಿಸಬೇಕಾದ ಸಮಯ',
    beforeFood: 'ಊಟಕ್ಕೆ ಮುಂಚೆ',
    withFood: 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ನಂತರ',
    afterFood: 'ಊಟದ ನಂತರ',
    emptyStomach: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ',
    noMedicinesScheduled: 'ಈ ಸಮಯಕ್ಕೆ ಯಾವುದೇ ಔಷಧಿಗಳಿಲ್ಲ.',

    genericName: 'ಜೆನೆರಿಕ್ ಹೆಸರು',
    brandName: 'ಬ್ರಾಂಡ್ ಹೆಸರು',
    route: 'ಸೇವಿಸುವ ವಿಧಾನ',
    purposeAndUses: 'ಮುಖ್ಯ ಉಪಯೋಗಗಳು',
    howItWorks: 'ಔಷಧಿ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    administrationTips: 'ಸೇವಿಸುವ ಸರಿಯಾದ ವಿಧಾನ',
    missedDose: 'ಔಷಧಿ ಮರೆತರೆ ಏನು ಮಾಡಬೇಕು',
    storageInfo: 'ಸಂಗ್ರಹಿಸುವ ವಿಧಾನ',
    commonSideEffects: 'ಸಾಮಾನ್ಯ ಅಡ್ಡಪರಿಣಾಮಗಳು',
    urgentSideEffects: 'ಮುಖ್ಯ ಲಕ್ಷಣಗಳು (ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ)',
    precautions: 'ಸುರಕ್ಷತಾ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು',

    drugInteractionAlert: 'ಔಷಧಿ ಪರಸ್ಪರ ಕ್ರಿಯೆ ಎಚ್ಚರಿಕೆ',
    duplicateIngredientAlert: 'ಒಂದೇ ಸಕ್ರಿಯ ಅಂಶ ಪುನರಾವರ್ತನೆಯಾಗಿದೆ',
    safetyScore: 'ಸುರಕ್ಷತಾ ಅಂಕ',
    recommendation: 'ವೈದ್ಯಕೀಯ ಸಲಹೆ',
    actionRequired: 'ರೋಗಿಯ ಕ್ರಮ',
    noInteractionsDetected: 'ಯಾವುದೇ ಹಾನಿಕಾರಕ ಹೊಂದಾಣಿಕೆಯಿಲ್ಲ.',
    noDuplicatesDetected: 'ಯಾವುದೇ ಪುನರಾವರ್ತಿತ ಅಂಶಗಳಿಲ್ಲ.',

    questionsHeader: 'ವೈದ್ಯರನ್ನು ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆಗಳು',
    questionsSub: 'ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಈ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.',
    copyQuestions: 'ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳನ್ನು ನಕಲಿಸಿ',
    copiedToClipboard: 'ನಕಲಿಸಲಾಗಿದೆ!',
    askAiHeader: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ AI ಸಹಾಯಕ',
    askAiSub: 'ಔಷಧಿಗಳ ಸಮಯ ಅಥವಾ ಅಡ್ಡಪರಿಣಾಮಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.',
    askAiPlaceholder: 'ಉದಾ: ಪ್ಯಾರಸಿಟಮಾಲ್ ಅನ್ನು ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಬಹುದೇ?',
    sendQuestion: 'ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ',
    suggestedPrompts: 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು:',
    aiSafetyDisclaimer: 'ಶೈಕ್ಷಣಿಕ ಮಾರ್ಗದರ್ಶನಕ್ಕೆ ಮಾತ್ರ. ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಪ್ರಮಾಣ ಬದಲಿಸಬೇಡಿ.',

    cabinetTitle: 'ನನ್ನ ಔಷಧಿ ಪೆಟ್ಟಿಗೆ',
    cabinetSubtitle: 'ನಿಮ್ಮ ಎಲ್ಲಾ ಔಷಧಿಗಳ ವಿವರವಾದ ಪಟ್ಟಿ.',
    searchMedicines: 'ಔಷಧಿ ಹೆಸರು ಅಥವಾ ಬಳಕೆಯಿಂದ ಹುಡುಕಿ...',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    filterByTiming: 'ಸಮಯದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ',
    historyArchiveTitle: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇತಿಹಾಸ',
    historyArchiveSub: 'ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾದ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು.',
    deletePrescriptionConfirm: 'ಈ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ಖಚಿತವಾಗಿ ಅಳಿಸಲು ಬಯಸುವಿರಾ?',

    abbreviationsTitle: 'ವೈದ್ಯಕೀಯ ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ',
    abbreviationsSubtitle: 'ವೈದ್ಯರ ಲ್ಯಾಟಿನ್ ಸಂಕ್ಷಿಪ್ತ ರೂಪಗಳ ಅರ್ಥಗಳು (OD, BD, TDS, ಇತ್ಯಾದಿ).',
    searchAbbreviations: 'ಸಂಕ್ಷಿಪ್ತ ರೂಪ ಹುಡುಕಿ (ಉದಾ: BD, TDS)...',
    privacyTitle: 'ಗೌಪ್ಯತೆ ಕೇಂದ್ರ',
    privacySubtitle: 'ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಅಥವಾ ಅಳಿಸಿ.',
    purgeAllData: 'ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ',
    purgeSuccess: 'ಎಲ್ಲಾ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಅಳಿಸಲಾಗಿದೆ.',

    globalFooterTitle: 'ವೈದ್ಯಕೀಯ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸಿಂಪ್ಲಿಫೈಯರ್ — ರೋಗಿ ಶಿಕ್ಷಣ & ಸುರಕ್ಷತಾ ವ್ಯವಸ್ಥೆ',
    globalDisclaimer:
      'ಹಕ್ಕುತ್ಯಾಗ: ಈ ಅಪ್ಲಿಕೇಶನ್ ರೋಗಿಗಳಿಗೆ ಔಷಧಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಒದಗಿಸುತ್ತದೆ. ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವನ್ನು ನೀಡುವುದಿಲ್ಲ. ನಿಮ್ಮ ಔಷಧಿಗಳ ಬಗ್ಗೆ ಯಾವಾಗಲೂ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    translatingMessage: 'ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...',
  },

  ml: {
    appName: 'മെഡിക്കൽ പ്രിസ്ക്രിപ്ഷൻ സിംപ്ലിഫയർ',
    appSubtitle: 'ലളിതം • സുരക്ഷിതം • രോഗീസൗഹൃദം',
    safeEducationalAssistant: 'സുരക്ഷിത വിദ്യാഭ്യാസ സഹായി',
    safetyBannerText: 'ഡോക്ടറുടെയോ ഫാർമസിസ്റ്റിന്റെയോ പകരക്കാരനല്ല • വിവരങ്ങൾ എപ്പോഴും സ്ഥിരീകരിക്കുക',
    simpleModeOn: '★ ലളിത മോഡ്: ഓൺ',
    simpleModeOff: '☆ ലളിത മോഡ്',
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    simplifyPrescription: 'കുറിപ്പടി ലളിതമാക്കുക',
    myMedicines: 'എന്റെ മരുന്നുകൾ',
    history: 'ചരിത്രവും രേഖകളും',
    safetyCenter: 'സുരക്ഷയും മുന്നറിയിപ്പുകളും',
    abbreviations: 'വൈദ്യശാസ്ത്ര ചുരുക്കെഴുത്തുകൾ',
    privacyRights: 'സ്വകാര്യതയും അവകാശങ്ങളും',
    adminTelemetry: 'സിസ്റ്റം നില',
    signIn: 'ലോഗിൻ',
    myAccount: 'എന്റെ അക്കൗണ്ട്',
    signOut: 'ലോഗ് ഔട്ട്',
    demoMode: 'ഡെമോ മോഡ്',
    tryDemo: 'ഡെമോ കാണുക',
    exportPdf: 'PDF ഗൈഡ് ഡൗൺലോഡ് ചെയ്യുക',
    print: 'പ്രിന്റ് ചെയ്യുക',
    backToDashboard: 'ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക',
    back: 'പിന്നോട്ട്',
    cancel: 'റദ്ദാക്കുക',
    save: 'മാറ്റങ്ങൾ സംരക്ഷിക്കുക',
    delete: 'ഇല്ലാതാക്കുക',
    confirm: 'സ്ഥിരീകരിച്ച് തുടരുക',
    edit: 'വിവരങ്ങൾ തിരുത്തുക',
    close: 'അടയ്ക്കുക',
    verified: 'സ്ഥിരീകരിച്ചു',
    confidence: 'വിശ്വാസ്യത',
    date: 'തീയതി',
    prescriber: 'ഡോക്ടർ',

    heroTag: 'രോഗികളുടെ ആരോഗ്യ ശാക്തീകരണം',
    heroHeadline: 'മെഡിക്കൽ പ്രിസ്ക്രിപ്ഷൻ സിംപ്ലിഫയർ',
    heroSubheadline: 'നിങ്ങളുടെ കുറിപ്പടി ലളിതമായ മലയാളത്തിൽ മനസ്സിലാക്കുക.',
    heroDescription:
      'ഡോക്ടറുടെ കൈയക്ഷരം, സങ്കീർണ്ണമായ ചുരുക്കെഴുത്തുകൾ എന്നിവ ലളിതമായ ദൈനംദിന സമയക്രമമാക്കുക.',
    heroConfidenceRating: 'വിശ്വാസ്യത റേറ്റിംഗ്',
    heroInteractionWarnings: 'മരുന്ന് പ്രതിപ്രവർത്തന മുന്നറിയിപ്പുകൾ',
    heroDoctorQuestions: 'ഡോക്ടറോട് ചോദിക്കേണ്ട ചോദ്യങ്ങൾ',
    heroLanguages: '6 പ്രാദേശിക ഭാഷകൾ',
    howItWorksTitle: 'ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു',
    howItWorksSubtitle: 'രോഗി സുരക്ഷയ്ക്ക് മുൻഗണന നൽകുന്ന 5-ഘട്ട പ്രക്രിയ.',
    step1Title: '1. അപ്‌ലോഡ് ചെയ്യുക',
    step1Desc: 'കുറിപ്പടിയുടെ ഫോട്ടോ, PDF അല്ലെങ്കിൽ ടെക്സ്റ്റ് നൽകുക.',
    step2Title: '2. വിഷൻ & റീഡിംഗ്',
    step2Desc: 'മരുന്നുകളുടെ പേരുകളും അളവുകളും കൃത്യമായി കണ്ടെത്തുന്നു.',
    step3Title: '3. സുരക്ഷാ പരിശോധന',
    step3Desc: 'മരുന്നുകളുടെ അനുയോജ്യതയും കൈയക്ഷരവും പരിശോധിക്കുന്നു.',
    step4Title: '4. സമയക്രമം',
    step4Desc: 'രാവിലെ, ഉച്ചയ്ക്ക്, വൈകുന്നേരം, രാത്രി എന്നിങ്ങനെ ക്രമീകരിക്കുന്നു.',
    step5Title: '5. ബഹുഭാഷാ സൗകര്യം',
    step5Desc: 'മലയാളം, തെലുങ്ക്, ഹിന്ദി, തമിഴ്, കന്നഡ, ഇംഗ്ലീഷ് എന്നിവയിൽ വേഗത്തിൽ മാറുക.',

    totalPrescriptions: 'ആകെ കുറിപ്പടികൾ',
    activeMedicines: 'നിലവിലെ മരുന്നുകൾ',
    safetyCautions: 'സുരക്ഷാ മുൻകരുതലുകൾ',
    needsVerification: 'സ്ഥിരീകരണം ആവശ്യമാണ്',
    quickActions: 'ദ്രുത പ്രവർത്തനങ്ങൾ',
    uploadNewPrescription: 'കുറിപ്പടിയുടെ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക',
    manualPrescriptionEntry: 'വിവരങ്ങൾ നേരിട്ട് നൽകുക',
    browseMedicineCabinet: 'മരുന്ന് പെട്ടി തുറക്കുക',
    exploreSafetyGuide: 'സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശം',
    searchMedicalAbbreviations: 'ചുരുക്കെഴുത്തുകൾ തിരയുക',
    loadSamplePrescription: 'മാതൃകാ കുറിപ്പടി കാണുക',
    recentPrescriptions: 'സംരക്ഷിച്ച കുറിപ്പടികൾ',
    noPrescriptionsYet: 'കുറിപ്പടികൾ ഒന്നും ലഭ്യമല്ല',
    noPrescriptionsSub: 'ദൈനംദിന സമയക്രമം ലഭിക്കാൻ കുറിപ്പടിയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.',
    viewDetails: 'പൂർണ്ണ വിവരങ്ങൾ കാണുക',
    allClearNotice: 'എല്ലാ മരുന്നുകളും പരിശോധിച്ചുറപ്പിച്ചു.',
    verificationRequiredNotice: 'ചില വിവരങ്ങൾക്ക് കൈയക്ഷര സ്ഥിരീകരണം ആവശ്യമാണ്.',

    uploadPrescriptionTitle: 'കുറിപ്പടി ലളിതമാക്കൂ',
    uploadPrescriptionSub: 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്ത് വ്യക്തമായ സമയക്രമം നേടൂ.',
    tabPhotoUpload: 'കുറിപ്പടി ചിത്രം',
    tabPdfDocument: 'PDF രേഖ',
    tabPasteText: 'ടെക്സ്റ്റ് എഴുതുക',
    tabManualEntry: 'ഫോം',
    dragDropImage: 'കുറിപ്പടിയുടെ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക',
    dragDropSub: 'JPEG, PNG, WEBP പിന്തുണയ്ക്കുന്നു',
    browseFiles: 'ഫയലുകൾ തിരഞ്ഞെടുക്കുക',
    pastePrescriptionText: 'കുറിപ്പടിയിലെ വിവരങ്ങൾ',
    pastePlaceholder: 'ഉദാ: Tab Augmentin 625mg 1-0-1 x 5 ദിവസം ഭക്ഷണത്തിന് ശേഷം',
    analyzePrescriptionButton: 'കുറിപ്പടി വിശകലനം ചെയ്യുക',
    analyzingPrescription: 'വിശകലനം ചെയ്യുന്നു...',
    privacyNoticeUpload: '🔒 സുരക്ഷിതം: നിങ്ങളുടെ വിവരങ്ങൾ പൂർണ്ണമായും സുരക്ഷിതമാണ്.',
    cameraCapture: 'ക്യാമറയിൽ ഫോട്ടോ എടുക്കുക',
    or: 'അല്ലെങ്കിൽ',
    prescriptionTitleLabel: 'ശീർഷകം',
    doctorNameLabel: 'ഡോക്ടറുടെ / ക്ലിനിക്കിന്റെ പേര്',
    clinicNameLabel: 'ആശുപത്രി',
    addMedicineRow: '+ അടുത്ത മരുന്ന് ചേർക്കുക',
    medicineName: 'മരുന്നിന്റെ പേര്',
    dosage: 'അളവ്',
    strength: 'വീര്യം (ഉദാ: 500mg)',
    frequency: 'തവണ (ഉദാ: 1-0-1)',
    timing: 'കഴിക്കേണ്ട സമയം',
    duration: 'കാലയളവ് (ഉദാ: 5 ദിവസം)',
    instructions: 'പ്രത്യേക നിർദ്ദേശങ്ങൾ',

    verificationTitle: 'വിവരങ്ങൾ പരിശോധിക്കുക',
    verificationSubtitle: 'അന്തിಮ സമയക്രമത്തിന് മുൻപ് മരുന്നുകളുടെ പേരുകൾ സ്ഥിരീകരിക്കുക.',
    highConfidenceBadge: 'ഉയർന്ന വിശ്വാസ്യത (സ്ഥിരീകരിച്ചു)',
    mediumConfidenceBadge: 'ഇടത്തരം വിശ്വാസ്യത (പരിശോധിക്കുക)',
    lowConfidenceBadge: 'കുറഞ്ഞ വിശ്വാസ്യത (ദയവായി സ്ഥിരീകരിക്കുക)',
    clarityNoticeHigh: 'വ്യക്തമായ കൈയക്ഷരം തിരിച്ചറിഞ്ഞു.',
    clarityNoticeMedium: 'കൈയക്ഷരം അല്പം അവ്യക്തമാണ്. അളവ് സ്ഥിരീകരിക്കുക.',
    clarityNoticeLow: 'കൈയക്ഷരം വ്യക്തമല്ല. യഥാർത്ഥ കുറിപ്പടിയുമായി പരിശോധിക്കുക.',
    confirmAndProceed: 'എല്ലാ വിവരങ്ങളും സ്ഥിരീകരിക്കുക',
    editMedicineDetails: 'തിരുത്തുക',
    unclearHandwritingAlert: 'അവ്യക്തമായ കൈയക്ഷര മുന്നറിയിപ്പ്: കുറിപ്പടി പരിശോധിക്കുക.',

    tabDailyTimeline: '1. ദൈനംദിന സമയക്രമം',
    tabMedicineCards: '2. മരുന്ന് കാർഡുകൾ',
    tabSideEffects: '3. പാർശ്വഫലങ്ങൾ',
    tabInteractions: '4. മരുന്ന് പ്രതിപ്രവർത്തനങ്ങൾ',
    tabSafetyCenter: '5. സുരക്ഷാ കേന്ദ്രം',
    tabDoctorQuestions: '6. ഡോക്ടറോട് ചോദിക്കേണ്ടവ',
    tabAskAi: '7. AI സഹായി',
    tabCompareMeds: '8. മരുന്നുകളുടെ താരതമ്യം',
    tabSummaryReport: '9. സംഗ്രഹ റിപ്പോർട്ട്',

    morningTiming: 'രാവിലെ',
    morningSub: 'പ്രഭാതഭക്ഷണം / 7:00 AM – 9:00 AM',
    afternoonTiming: 'ഉച്ചയ്ക്ക്',
    afternoonSub: 'ഉച്ചഭക്ഷണം / 12:00 PM – 2:00 PM',
    eveningTiming: 'വൈകുന്നേരം',
    eveningSub: 'അത്താഴം / 6:00 PM – 8:00 PM',
    bedtimeTiming: 'ഉറങ്ങുന്നതിന് മുൻപ്',
    bedtimeSub: 'രാത്രി ഉറങ്ങുന്നതിന് മുൻപ് / 9:30 PM – 11:00 PM',
    asNeededTiming: 'ആവശ്യമുള്ളപ്പോൾ (SOS)',
    asNeededSub: 'ലക്ഷണങ്ങൾ ഉണ്ടാകുമ്പോൾ മാത്രം',
    unclearTiming: 'ഡോക്ടറോട് ചോദിച്ച് ഉറപ്പാക്കേണ്ട സമയം',
    beforeFood: 'ഭക്ഷണത്തിന് മുൻപ്',
    withFood: 'ഭക്ഷണത്തോടൊപ്പം അല്ലെങ്കിൽ ശേഷം',
    afterFood: 'ഭക്ഷണത്തിന് ശേഷം',
    emptyStomach: 'വെറുംവയറ്റിൽ',
    noMedicinesScheduled: 'ഈ സമയത്തേക്ക് മരുന്നുകളൊന്നുമില്ല.',

    genericName: 'ജനറിക് പേര്',
    brandName: 'ബ്രാൻഡ് പേര്',
    route: 'കഴിക്കുന്ന രീതി',
    purposeAndUses: 'പ്രധാന ഉപയോഗങ്ങൾ',
    howItWorks: 'മരുന്ന് എങ്ങനെ പ്രവർത്തിക്കുന്നു',
    administrationTips: 'ശരിയായി കഴിക്കുന്ന രീതി',
    missedDose: 'മരുന്ന് കഴിക്കാൻ മറന്നാൽ എന്തുചെയ്യണം',
    storageInfo: 'സൂക്ഷിക്കേണ്ട വിധം',
    commonSideEffects: 'സാധാരണ പാർശ്വഫലങ്ങൾ',
    urgentSideEffects: 'പ്രധാന ലക്ഷണങ്ങൾ (ഡോക്ടറെ സമീപിക്കുക)',
    precautions: 'സുരക്ഷാ മുൻകരുതലുകൾ',

    drugInteractionAlert: 'മരുന്ന് പ്രതിപ്രവർത്തന മുന്നറിയിപ്പ്',
    duplicateIngredientAlert: 'ഒരേ ഘടകം വീണ്ടും കണ്ടെത്തി',
    safetyScore: 'സുരക്ഷാ സ്കോർ',
    recommendation: 'വൈദ്യോപദേശം',
    actionRequired: 'രോഗി ചെയ്യേണ്ടത്',
    noInteractionsDetected: 'ദോഷകരമായ പ്രതിപ്രവർത്തനങ്ങളൊന്നുമില്ല.',
    noDuplicatesDetected: 'ആവർത്തിച്ചുള്ള ഘടകങ്ങളൊന്നുമില്ല.',

    questionsHeader: 'ഡോക്ടറോട് ചോദിക്കേണ്ട ചോദ്യങ്ങൾ',
    questionsSub: 'അടുത്ത സന്ദർശനത്തിൽ ഈ ചോദ്യങ്ങൾ ചോദിക്കുക.',
    copyQuestions: 'എല്ലാ ചോദ്യങ്ങളും പകർത്തുക',
    copiedToClipboard: 'പകർത്തി!',
    askAiHeader: 'AI സഹായി',
    askAiSub: 'മരുന്നുകളുടെ സമയത്തെയും പാർശ്വഫലങ്ങളെയും കുറിച്ച് ചോദിക്കുക.',
    askAiPlaceholder: 'ഉദാ: പാരസെറ്റമോൾ ഭക്ഷണത്തിന് ശേഷം കഴിക്കാമോ?',
    sendQuestion: 'ചോദ്യം അയയ്ക്കുക',
    suggestedPrompts: 'നിർദ്ദേശിച്ച ചോദ്യങ്ങൾ:',
    aiSafetyDisclaimer: 'വിദ്യാഭ്യാസ ആവശ്യങ്ങൾക്ക് മാത്രം. ഡോക്ടറുടെ ഉപദേശമില്ലാതെ അളവ് മാറ്റരുത്.',

    cabinetTitle: 'എന്റെ മരുന്ന് പെട്ടി',
    cabinetSubtitle: 'നിങ്ങളുടെ എല്ലാ മരുന്നുകളുടെയും സമഗ്രമായ വിവരങ്ങൾ.',
    searchMedicines: 'മരുന്നിന്റെ പേരോ ഉപയോഗമോ തിരയുക...',
    allCategories: 'എല്ലാ വിഭാഗങ്ങളും',
    filterByTiming: 'സമയമനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക',
    historyArchiveTitle: 'കുറിപ്പടി ചരിത്രം',
    historyArchiveSub: 'സുരക്ഷിതമായി സൂക്ഷിച്ച കുറിപ്പടികൾ.',
    deletePrescriptionConfirm: 'ഈ കുറിപ്പടി ശാശ്വതമായി ഇല്ലാതാക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?',

    abbreviationsTitle: 'ചുരുക്കെഴുത്തുകളുടെ അർത്ഥം',
    abbreviationsSubtitle: 'ഡോക്ടറുടെ ലാറ്റിൻ ചുരുക്കെഴുത്തുകൾ (OD, BD, TDS മുതലായവ).',
    searchAbbreviations: 'ചുരുക്കെഴുത്ത് തിരയുക (ഉദാ: BD, TDS)...',
    privacyTitle: 'സ്വകാര്യതാ കേന്ദ്രം',
    privacySubtitle: 'നിങ്ങളുടെ രേഖകൾ കൈകാര്യം ചെയ്യുക അല്ലെങ്കിൽ ഇല്ലാതാക്കുക.',
    purgeAllData: 'എല്ലാ ഡാറ്റയും പൂർണ്ണമായി ഇല്ലാതാക്കുക',
    purgeSuccess: 'എല്ലാ കുറിപ്പടികളും സുരಕ್ಷಿತമായി നീക്കം ചെയ്തു.',

    globalFooterTitle: 'മെഡിക്കൽ പ്രിസ്ക്രിപ്ഷൻ സിംപ്ലിഫയർ — രോഗി വിദ്യാഭ്യാസ & സുരക്ഷാ സംവിധാനം',
    globalDisclaimer:
      'ശ്രദ്ധിക്കുക: ഈ ആപ്ലിക്കേഷൻ രോഗികൾക്ക് മരുന്നുകൾ മനസ്സിലാക്കാൻ മാത്രമുള്ളതാണ്. ഇത് വൈദ്യപരിശോധനയ്ക്ക് പകരമാവില്ല. മരുന്നുകളെക്കുറിച്ച് എപ്പോഴും ഡോക്ടറുടെ ഉപദേശം തേടുക.',
    translatingMessage: 'വിവർത്തനം ചെയ്യുന്നു...',
  },
};

export function getTranslation(lang: SupportedLanguage, key: keyof TranslationDictionary): string {
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  return dict[key] || UI_TRANSLATIONS.en[key] || String(key);
}
