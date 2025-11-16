/**
 * Medical/General Assessment Scenario Tests
 * 
 * Tests for general medical assessment scenarios including:
 * - Chest pain
 * - Shortness of breath
 * - Abdominal pain
 * - Altered mental status
 * - Other medical emergencies
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Medical Assessment Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  describe('Chest Pain Cases', () => {
    test('Classic Chest Pain - Should complete systematic assessment', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-chest-pain',
        category: 'chest_pain',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'opqrst',
            action: 'Complete OPQRST assessment',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'sample',
            action: 'Complete SAMPLE history',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'vital-signs',
            action: 'Obtain complete vital signs',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'ecg',
            action: 'Perform 12-lead ECG',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'crushing-pain',
            category: 'History',
            description: 'Crushing chest pain suggests cardiac etiology',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'radiation',
            category: 'History',
            description: 'Pain radiating to left arm - classic ACS presentation',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'diaphoresis',
            category: 'Physical',
            description: 'Diaphoresis indicates sympathetic response',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'cardiac-history',
            category: 'History',
            description: 'History of hypertension and high cholesterol',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'history',
            action: 'OPQRST pain assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'SAMPLE history',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Cardiovascular examination',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'Acute coronary syndrome',
          'Angina',
          'Myocardial infarction',
          'Other cardiac etiology',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What brings you to call 911 today?',
        },
        {
          id: 'onset',
          type: 'ask_question',
          data: 'When did the pain start?',
        },
        {
          id: 'provocation',
          type: 'ask_question',
          data: 'What were you doing when it started?',
        },
        {
          id: 'quality',
          type: 'ask_question',
          data: 'Can you describe the pain for me?',
        },
        {
          id: 'flag-crushing',
          type: 'identify_red_flag',
          data: { redFlagId: 'crushing-pain' },
        },
        {
          id: 'radiation',
          type: 'ask_question',
          data: 'Does the pain move anywhere?',
        },
        {
          id: 'flag-radiation',
          type: 'identify_red_flag',
          data: { redFlagId: 'radiation' },
        },
        {
          id: 'severity',
          type: 'ask_question',
          data: 'On a scale of 1 to 10, how would you rate the pain?',
        },
        {
          id: 'time',
          type: 'ask_question',
          data: 'Is the pain constant or does it come and go?',
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs',
            parameters: {},
          },
        },
        {
          id: 'physical-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Physical examination',
            parameters: {},
          },
        },
        {
          id: 'flag-diaphoresis',
          type: 'identify_red_flag',
          data: { redFlagId: 'diaphoresis' },
        },
        {
          id: 'sample-allergies',
          type: 'ask_question',
          data: 'Do you have any allergies?',
        },
        {
          id: 'sample-medications',
          type: 'ask_question',
          data: 'What medications do you take?',
        },
        {
          id: 'sample-past-history',
          type: 'ask_question',
          data: 'Do you have any medical conditions?',
        },
        {
          id: 'flag-cardiac-history',
          type: 'identify_red_flag',
          data: { redFlagId: 'cardiac-history' },
        },
        {
          id: 'sample-last-oral',
          type: 'ask_question',
          data: 'When did you last eat or drink?',
        },
        {
          id: 'sample-events',
          type: 'ask_question',
          data: 'What were you doing when this started?',
        },
        {
          id: 'ecg',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Perform 12-lead ECG',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.assessmentCompleteness).toBeGreaterThan(60); // 2/3 assessments completed
      expect(result.identifiedRedFlags).toContain('crushing-pain');
      expect(result.identifiedRedFlags).toContain('radiation');
    });
  });

  describe('Respiratory Distress Cases', () => {
    test('COPD Exacerbation - Should differentiate from CHF', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-copd-sob',
        category: 'shortness_of_breath',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'lung-sounds',
            action: 'Auscultate lung sounds',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'vitals-including-spo2',
            action: 'Obtain vital signs including SpO2',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'medical-history',
            action: 'Obtain relevant medical history',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'wheezing',
            category: 'Physical',
            description: 'Bilateral wheezing suggests bronchospasm',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'tripod-position',
            category: 'Physical',
            description: 'Tripod position indicates severe respiratory distress',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'hypoxia',
            category: 'Vital Signs',
            description: 'SpO2 88% indicates hypoxia',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'copd-history',
            category: 'History',
            description: 'Known COPD - treat appropriately',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Lung auscultation',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Work of breathing assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Respiratory history',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'COPD exacerbation',
          'CHF',
          'Asthma',
          'Pneumonia',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'general-impression',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'General impression',
            parameters: {},
          },
        },
        {
          id: 'flag-tripod',
          type: 'identify_red_flag',
          data: { redFlagId: 'tripod-position' },
        },
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What is bothering you today?',
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs',
            parameters: {},
          },
        },
        {
          id: 'flag-hypoxia',
          type: 'identify_red_flag',
          data: { redFlagId: 'hypoxia' },
        },
        {
          id: 'lung-sounds',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Auscultate lung sounds',
            parameters: {},
          },
        },
        {
          id: 'flag-wheezing',
          type: 'identify_red_flag',
          data: { redFlagId: 'wheezing' },
        },
        {
          id: 'work-of-breathing',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess work of breathing',
            parameters: {},
          },
        },
        {
          id: 'medical-history',
          type: 'ask_question',
          data: 'Do you have any lung problems?',
        },
        {
          id: 'flag-copd',
          type: 'identify_red_flag',
          data: { redFlagId: 'copd-history' },
        },
        {
          id: 'medications',
          type: 'ask_question',
          data: 'What medications do you take?',
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('wheezing');
      expect(result.identifiedRedFlags).toContain('hypoxia');
    });
  });

  describe('Abdominal Pain Cases', () => {
    test('Suspected Appendicitis - Should transport for surgical evaluation', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-abdominal-pain',
        category: 'abdominal_pain',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'opqrst-abdominal',
            action: 'Complete OPQRST for abdominal pain',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'abdominal-exam',
            action: 'Perform abdominal examination',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'vitals',
            action: 'Obtain vital signs',
            timing: 'immediate',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'rlq-pain',
            category: 'Location',
            description: 'Right lower quadrant pain suggests appendicitis',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'guarding',
            category: 'Physical',
            description: 'Guarding indicates peritoneal irritation',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'fever',
            category: 'Vital Signs',
            description: 'Fever suggests infection',
            severity: 'medium',
            shouldBeIdentified: true,
          },
          {
            id: 'anorexia',
            category: 'History',
            description: 'Not eating since yesterday - classic appendicitis presentation',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Abdominal palpation',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Pain history',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'Appendicitis',
          'Ovarian pathology',
          'Gastroenteritis',
          'Other abdominal emergency',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What is bothering you?',
        },
        {
          id: 'location',
          type: 'ask_question',
          data: 'Where is the pain?',
        },
        {
          id: 'flag-rlq',
          type: 'identify_red_flag',
          data: { redFlagId: 'rlq-pain' },
        },
        {
          id: 'onset',
          type: 'ask_question',
          data: 'When did the pain start?',
        },
        {
          id: 'quality',
          type: 'ask_question',
          data: 'What does the pain feel like?',
        },
        {
          id: 'severity',
          type: 'ask_question',
          data: 'On a scale of 1 to 10, how bad is it?',
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs',
            parameters: {},
          },
        },
        {
          id: 'flag-fever',
          type: 'identify_red_flag',
          data: { redFlagId: 'fever' },
        },
        {
          id: 'abdominal-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Abdominal examination',
            parameters: {},
          },
        },
        {
          id: 'flag-guarding',
          type: 'identify_red_flag',
          data: { redFlagId: 'guarding' },
        },
        {
          id: 'last-meal',
          type: 'ask_question',
          data: 'When did you last eat?',
        },
        {
          id: 'flag-anorexia',
          type: 'identify_red_flag',
          data: { redFlagId: 'anorexia' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport for surgical evaluation',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('rlq-pain');
      expect(result.identifiedRedFlags).toContain('guarding');
    });
  });

  describe('Allergic Reactions', () => {
    test('Anaphylaxis - Should treat immediately', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-anaphylaxis',
        category: 'other',
        expectedDuration: 300,
        criticalActions: [
          {
            id: 'epinephrine',
            action: 'Administer epinephrine',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
          {
            id: 'airway-assessment',
            action: 'Assess and manage airway',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'oxygen',
            action: 'Administer oxygen',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'iv-access',
            action: 'Establish IV access',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'stridor',
            category: 'Physical',
            description: 'Stridor indicates airway compromise',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 60,
          },
          {
            id: 'facial-swelling',
            category: 'Physical',
            description: 'Facial swelling - angioedema',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'prior-anaphylaxis',
            category: 'History',
            description: 'History of anaphylaxis - knows severity',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'shellfish-allergy',
            category: 'History',
            description: 'Known shellfish allergy - exposure confirmed',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Airway assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Skin assessment',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Epinephrine',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Diphenhydramine',
            type: 'medication',
            required: false,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Anaphylaxis',
          'Severe allergic reaction',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What happened?',
        },
        {
          id: 'initial-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'General impression',
            parameters: {},
          },
        },
        {
          id: 'flag-swelling',
          type: 'identify_red_flag',
          data: { redFlagId: 'facial-swelling' },
        },
        {
          id: 'airway-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Airway assessment',
            parameters: {},
          },
        },
        {
          id: 'flag-stridor',
          type: 'identify_red_flag',
          data: { redFlagId: 'stridor' },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'High-flow oxygen',
            parameters: {},
          },
        },
        {
          id: 'allergies',
          type: 'ask_question',
          data: 'Do you have any allergies?',
        },
        {
          id: 'flag-shellfish',
          type: 'identify_red_flag',
          data: { redFlagId: 'shellfish-allergy' },
        },
        {
          id: 'prior-reactions',
          type: 'ask_question',
          data: 'Have you had reactions like this before?',
        },
        {
          id: 'flag-prior',
          type: 'identify_red_flag',
          data: { redFlagId: 'prior-anaphylaxis' },
        },
        {
          id: 'epinephrine',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer epinephrine',
            parameters: { dose: '0.3mg', route: 'IM', location: 'vastus lateralis' },
          },
        },
        {
          id: 'iv',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish IV access',
            parameters: {},
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('stridor');
      expect(result.identifiedRedFlags).toContain('facial-swelling');
      expect(result.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Server-Defined Clinical Scenarios', () => {
    test('Back Pain with Neurological Symptoms (Cauda Equina) - Should recognize emergency', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'clinical-back-pain-neuro',
        category: 'other',
        expectedDuration: 480,
        criticalActions: [
          {
            id: 'neuro-exam',
            action: 'Detailed neurological examination',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'bladder-assessment',
            action: 'Assess urinary symptoms',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'motor-strength',
            action: 'Test bilateral leg strength',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'urgent-transport',
            action: 'Urgent transport to facility with neurosurgical capabilities',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'bilateral-leg-weakness',
            category: 'Neurological',
            description: 'Progressive bilateral leg weakness - cauda equina',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'urinary-retention',
            category: 'Symptoms',
            description: 'Difficulty urinating - key cauda equina indicator',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'cancer-history',
            category: 'History',
            description: 'Cancer history with new back pain - spinal metastasis concern',
            severity: 'critical',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Neurological examination',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Urinary symptoms assessment',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'Cauda equina syndrome',
          'Spinal metastasis',
          'Spinal cord compression',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What brings us out today?',
        },
        {
          id: 'pain-history',
          type: 'ask_question',
          data: 'Tell me about your back pain',
        },
        {
          id: 'leg-symptoms',
          type: 'ask_question',
          data: 'Are you having any leg weakness?',
        },
        {
          id: 'flag-weakness',
          type: 'identify_red_flag',
          data: { redFlagId: 'bilateral-leg-weakness' },
        },
        {
          id: 'motor-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Test bilateral leg strength',
            parameters: {},
          },
        },
        {
          id: 'urinary-symptoms',
          type: 'ask_question',
          data: 'Any problems with urination?',
        },
        {
          id: 'flag-urinary',
          type: 'identify_red_flag',
          data: { redFlagId: 'urinary-retention' },
        },
        {
          id: 'medical-history',
          type: 'ask_question',
          data: 'What is your medical history?',
        },
        {
          id: 'flag-cancer',
          type: 'identify_red_flag',
          data: { redFlagId: 'cancer-history' },
        },
        {
          id: 'neuro-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Detailed neurological examination',
            parameters: {},
          },
        },
        {
          id: 'note',
          type: 'add_note',
          data: { 
            note: 'Suspected cauda equina syndrome - urgent neurosurgical evaluation required' 
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport to facility with neurosurgical capabilities',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('bilateral-leg-weakness');
      expect(result.identifiedRedFlags).toContain('urinary-retention');
      expect(result.identifiedRedFlags).toContain('cancer-history');
    });
  });

  describe('Pulmonary Emergencies', () => {
    test('Pulmonary Embolism - Should recognize high-risk presentation', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-pulmonary-embolism',
        category: 'shortness_of_breath',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'vitals',
            action: 'Obtain complete vital signs',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'oxygen',
            action: 'Administer high-flow oxygen',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'cardiac-monitor',
            action: 'Place on cardiac monitor',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'iv-access',
            action: 'Establish IV access',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'risk-factors',
            action: 'Assess for PE risk factors',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'rapid-transport',
            action: 'Rapid transport to hospital',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'sudden-dyspnea',
            category: 'Symptoms',
            description: 'Sudden onset severe dyspnea',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'pleuritic-pain',
            category: 'Symptoms',
            description: 'Sharp pleuritic chest pain',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'tachycardia',
            category: 'Vital Signs',
            description: 'Heart rate 128 - compensatory tachycardia',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'hypoxia',
            category: 'Vital Signs',
            description: 'SpO2 89% on room air - significant hypoxia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'recent-surgery',
            category: 'History',
            description: 'Recent orthopedic surgery - major PE risk factor',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'unilateral-edema',
            category: 'Physical',
            description: 'Left leg swelling - suggests DVT source',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'vital_signs',
            action: 'Complete vital signs including SpO2',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Lung auscultation',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Leg examination for DVT signs',
            priority: 'important',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Risk factor assessment',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'High-flow oxygen',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
          {
            name: 'IV fluid bolus',
            type: 'treatment',
            required: false,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Pulmonary embolism',
          'Pneumonia',
          'Pneumothorax',
          'Acute coronary syndrome',
          'Pericarditis',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What brings us out today?',
        },
        {
          id: 'onset',
          type: 'ask_question',
          data: 'When did this start?',
        },
        {
          id: 'flag-sudden',
          type: 'identify_red_flag',
          data: { redFlagId: 'sudden-dyspnea' },
        },
        {
          id: 'pain-quality',
          type: 'ask_question',
          data: 'Tell me about the chest pain',
        },
        {
          id: 'flag-pleuritic',
          type: 'identify_red_flag',
          data: { redFlagId: 'pleuritic-pain' },
        },
        {
          id: 'initial-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'General impression',
            parameters: {},
          },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Vital signs including SpO2',
            parameters: {},
          },
        },
        {
          id: 'flag-tachycardia',
          type: 'identify_red_flag',
          data: { redFlagId: 'tachycardia' },
        },
        {
          id: 'flag-hypoxia',
          type: 'identify_red_flag',
          data: { redFlagId: 'hypoxia' },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'High-flow oxygen via non-rebreather',
            parameters: { flow: '15 LPM' },
          },
        },
        {
          id: 'lung-sounds',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Auscultate lung sounds',
            parameters: {},
          },
        },
        {
          id: 'monitor',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Place on cardiac monitor',
            parameters: {},
          },
        },
        {
          id: 'medical-history',
          type: 'ask_question',
          data: 'What medical problems do you have?',
        },
        {
          id: 'recent-events',
          type: 'ask_question',
          data: 'Any recent surgeries or hospitalizations?',
        },
        {
          id: 'flag-surgery',
          type: 'identify_red_flag',
          data: { redFlagId: 'recent-surgery' },
        },
        {
          id: 'leg-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Examine legs for swelling or tenderness',
            parameters: {},
          },
        },
        {
          id: 'flag-edema',
          type: 'identify_red_flag',
          data: { redFlagId: 'unilateral-edema' },
        },
        {
          id: 'iv-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish IV access',
            parameters: { gauge: '18', location: 'AC' },
          },
        },
        {
          id: 'note-pe-suspicion',
          type: 'add_note',
          data: { note: 'High suspicion for pulmonary embolism - recent surgery + sudden dyspnea + pleuritic pain + leg swelling' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to ED',
            parameters: {},
          },
        },
        {
          id: 'notify-hospital',
          type: 'add_note',
          data: { note: 'Notified ED of suspected PE for CT angiography preparation' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(85);
      expect(result.identifiedRedFlags).toContain('sudden-dyspnea');
      expect(result.identifiedRedFlags).toContain('recent-surgery');
      expect(result.identifiedRedFlags).toContain('hypoxia');
    });

    test('COPD Exacerbation - Should differentiate from asthma and manage oxygen carefully', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'medical-copd-exacerbation',
        category: 'shortness_of_breath',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'history-copd',
            action: 'Obtain respiratory history',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'assess-severity',
            action: 'Assess severity of respiratory distress',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'controlled-oxygen',
            action: 'Administer controlled oxygen therapy',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'avoid-high-flow',
            action: 'Avoid excessive oxygen in COPD patient',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'bronchodilator',
            action: 'Administer bronchodilator',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'monitor-response',
            action: 'Monitor response to treatment',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'consider-cpap',
            action: 'Consider CPAP if available',
            timing: 'urgent',
            required: false,
          },
        ],
        redFlags: [
          {
            id: 'copd-history',
            category: 'History',
            description: 'Known COPD with home oxygen - chronic condition',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'chronic-smoker',
            category: 'History',
            description: '40-year smoking history - major risk factor',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'barrel-chest',
            category: 'Physical',
            description: 'Barrel chest appearance - chronic air trapping',
            severity: 'medium',
            shouldBeIdentified: true,
          },
          {
            id: 'productive-cough',
            category: 'Symptoms',
            description: 'Productive cough with purulent sputum - infection likely',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'tripod-position',
            category: 'Physical',
            description: 'Tripod positioning - severe respiratory distress',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'hypoxia',
            category: 'Vital Signs',
            description: 'SpO2 88% on room air - significant hypoxia but expected for COPD',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'accessory-muscles',
            category: 'Physical',
            description: 'Using accessory muscles - increased work of breathing',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'history',
            action: 'Respiratory disease history',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'SpO2 and respiratory rate',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Lung auscultation',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Work of breathing assessment',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'High-flow oxygen (>6 LPM)',
            type: 'treatment',
            required: false,
            contraindicated: true, // Dangerous in COPD - can suppress respiratory drive
          },
          {
            name: 'Controlled oxygen (2-4 LPM)',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Albuterol',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'COPD exacerbation',
          'Asthma exacerbation',
          'Pneumonia',
          'Pulmonary embolism',
          'Heart failure',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What brings us out today?',
        },
        {
          id: 'respiratory-history',
          type: 'ask_question',
          data: 'Do you have any lung problems? COPD? Asthma? Do you use oxygen at home?',
        },
        {
          id: 'flag-copd',
          type: 'identify_red_flag',
          data: { redFlagId: 'copd-history' },
        },
        {
          id: 'smoking-history',
          type: 'ask_question',
          data: 'Do you smoke? How long?',
        },
        {
          id: 'flag-smoker',
          type: 'identify_red_flag',
          data: { redFlagId: 'chronic-smoker' },
        },
        {
          id: 'observe-position',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Observe patient position and appearance',
            parameters: {},
          },
        },
        {
          id: 'flag-tripod',
          type: 'identify_red_flag',
          data: { redFlagId: 'tripod-position' },
        },
        {
          id: 'flag-barrel',
          type: 'identify_red_flag',
          data: { redFlagId: 'barrel-chest' },
        },
        {
          id: 'work-of-breathing',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess work of breathing and accessory muscle use',
            parameters: {},
          },
        },
        {
          id: 'flag-accessory',
          type: 'identify_red_flag',
          data: { redFlagId: 'accessory-muscles' },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs including SpO2',
            parameters: {},
          },
        },
        {
          id: 'flag-hypoxia',
          type: 'identify_red_flag',
          data: { redFlagId: 'hypoxia' },
        },
        {
          id: 'lung-sounds',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Auscultate lung sounds',
            parameters: {},
          },
        },
        {
          id: 'cough-assessment',
          type: 'ask_question',
          data: 'Are you coughing anything up? What color?',
        },
        {
          id: 'flag-productive',
          type: 'identify_red_flag',
          data: { redFlagId: 'productive-cough' },
        },
        {
          id: 'copd-recognition',
          type: 'add_note',
          data: { note: 'COPD exacerbation recognized - need controlled oxygen therapy to avoid suppressing respiratory drive' },
        },
        {
          id: 'controlled-oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Controlled oxygen via nasal cannula',
            parameters: { flow: '2-4 LPM', target: 'SpO2 88-92%' },
          },
        },
        {
          id: 'avoid-high-flow-note',
          type: 'add_note',
          data: { note: 'Avoiding high-flow oxygen - COPD patients rely on hypoxic drive, excessive O2 can worsen respiratory failure' },
        },
        {
          id: 'albuterol',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Albuterol nebulizer',
            parameters: { dose: '2.5mg', delivery: 'continuous if needed' },
          },
        },
        {
          id: 'monitor',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Continuous monitoring of SpO2 and respiratory status',
            parameters: {},
          },
        },
        {
          id: 'reassess',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Reassess after bronchodilator treatment',
            parameters: {},
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport to hospital',
            parameters: {},
          },
        },
        {
          id: 'hospital-note',
          type: 'add_note',
          data: { note: 'Notified ED of COPD exacerbation with likely infectious trigger - may need antibiotics and steroids' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.identifiedRedFlags).toContain('copd-history');
      expect(result.identifiedRedFlags).toContain('tripod-position');
      expect(result.identifiedRedFlags).toContain('hypoxia');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });
});

export default {};

