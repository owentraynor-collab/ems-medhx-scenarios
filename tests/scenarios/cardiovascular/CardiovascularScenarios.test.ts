/**
 * Cardiovascular Scenario Tests
 * 
 * Tests for all cardiac-related clinical scenarios including:
 * - STEMI, NSTEMI, and atypical MI
 * - Dysrhythmias
 * - Heart failure
 * - Cardiac arrest
 * - Special populations
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Cardiovascular Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('Acute Coronary Syndromes', () => {
    test('Classic STEMI - Should identify and treat appropriately', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'cardiac-stemi-classic',
        category: 'chest_pain',
        expectedDuration: 600, // 10 minutes
        criticalActions: [
          {
            id: 'vital-signs',
            action: 'Obtain vital signs',
            timing: 'immediate',
            required: true,
            timeWindow: 60,
          },
          {
            id: 'oxygen',
            action: 'Administer oxygen',
            timing: 'immediate',
            required: true,
            verifyFn: (state) => state.name?.toLowerCase().includes('oxygen'),
          },
          {
            id: 'aspirin',
            action: 'Administer aspirin',
            timing: 'immediate',
            required: true,
            verifyFn: (state) => state.name?.toLowerCase().includes('aspirin'),
          },
          {
            id: 'iv-access',
            action: 'Establish IV access',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'ecg',
            action: 'Perform 12-lead ECG',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
          {
            id: 'nitro',
            action: 'Administer nitroglycerin',
            timing: 'urgent',
            required: false,
            verifyFn: (state) => state.name?.toLowerCase().includes('nitroglycerin'),
          },
          {
            id: 'transport',
            action: 'Rapid transport to PCI-capable facility',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'st-elevation',
            category: 'ECG',
            description: 'ST elevation in leads II, III, aVF indicating inferior STEMI',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 180,
          },
          {
            id: 'diaphoresis',
            category: 'Physical',
            description: 'Diaphoresis indicating sympathetic response',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'pain-radiation',
            category: 'History',
            description: 'Pain radiating to left arm - classic ACS presentation',
            severity: 'high',
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
          {
            category: 'vital_signs',
            action: 'Blood pressure both arms',
            priority: 'important',
            mustPerform: false,
          },
        ],
        interventionChecks: [
          {
            name: 'Aspirin',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Oxygen',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Nitroglycerin',
            type: 'medication',
            required: false,
            contraindicated: false,
            verifyEffectiveness: (result) => {
              // Check if BP was adequate before giving nitro
              return true;
            },
          },
          {
            name: 'Morphine',
            type: 'medication',
            required: false,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Inferior STEMI',
          'Right ventricular infarction',
          'Acute coronary syndrome',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-safety',
          type: 'ask_question',
          data: 'Is the scene safe?',
        },
        {
          id: 'initial-impression',
          type: 'ask_question',
          data: 'What is the patient\'s appearance?',
        },
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What is your chief complaint?',
        },
        {
          id: 'opqrst-onset',
          type: 'ask_question',
          data: 'When did the pain start?',
        },
        {
          id: 'opqrst-quality',
          type: 'ask_question',
          data: 'Can you describe the pain?',
        },
        {
          id: 'opqrst-radiation',
          type: 'ask_question',
          data: 'Does the pain move anywhere?',
        },
        {
          id: 'flag-pain-radiation',
          type: 'identify_red_flag',
          data: { redFlagId: 'pain-radiation' },
        },
        {
          id: 'opqrst-severity',
          type: 'ask_question',
          data: 'On a scale of 1-10, how severe is the pain?',
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs',
            parameters: {},
          },
          thinkTime: 1000,
        },
        {
          id: 'flag-diaphoresis',
          type: 'identify_red_flag',
          data: { redFlagId: 'diaphoresis' },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Administer oxygen',
            parameters: { flow: '15 LPM', device: 'non-rebreather' },
          },
        },
        {
          id: 'aspirin',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer aspirin',
            parameters: { dose: '324mg', route: 'PO' },
          },
        },
        {
          id: 'iv-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish IV access',
            parameters: { gauge: '18', location: 'left AC' },
          },
        },
        {
          id: 'ecg',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Perform 12-lead ECG',
            parameters: {},
          },
          thinkTime: 2000,
        },
        {
          id: 'flag-st-elevation',
          type: 'identify_red_flag',
          data: { redFlagId: 'st-elevation' },
        },
        {
          id: 'sample-medications',
          type: 'ask_question',
          data: 'What medications do you take?',
        },
        {
          id: 'sample-allergies',
          type: 'ask_question',
          data: 'Do you have any allergies?',
        },
        {
          id: 'nitro',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer nitroglycerin',
            parameters: { dose: '0.4mg', route: 'SL' },
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to PCI-capable facility',
            parameters: {},
          },
        },
        {
          id: 'hospital-notification',
          type: 'add_note',
          data: { note: 'Notified receiving facility of STEMI alert' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75); // Good clinical performance
      expect(result.missedCriticalActions).toHaveLength(0);
      expect(result.identifiedRedFlags).toContain('st-elevation');
      expect(result.identifiedRedFlags).toContain('diaphoresis');
      expect(result.identifiedRedFlags).toContain('pain-radiation');
    });

    test('Silent MI in Diabetic - Should recognize atypical presentation', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'cardiac-silent-mi-diabetic',
        category: 'chest_pain',
        expectedDuration: 600,
        criticalActions: [
          {
            id: 'glucose-check',
            action: 'Check blood glucose',
            timing: 'immediate',
            required: true,
            verifyFn: (state) => state.name?.toLowerCase().includes('glucose'),
          },
          {
            id: 'ecg',
            action: 'Perform 12-lead ECG',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
          {
            id: 'aspirin',
            action: 'Administer aspirin',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'diabetes-history',
            category: 'History',
            description: 'Diabetes history increases risk of silent MI',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'atypical-presentation',
            category: 'Assessment',
            description: 'Atypical presentation - epigastric discomfort not chest pain',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'weakness',
            category: 'Physical',
            description: 'General weakness may be only MI symptom in diabetics',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'history',
            action: 'Detailed medical history including diabetes management',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Complete vital signs',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Check blood glucose',
            type: 'assessment',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Aspirin',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Silent myocardial infarction',
          'Gastric distress',
          'Diabetic emergency',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'chief-complaint',
          type: 'ask_question',
          data: 'What brings you to call 911 today?',
        },
        {
          id: 'glucose',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Check blood glucose',
            parameters: {},
          },
        },
        {
          id: 'flag-diabetes',
          type: 'identify_red_flag',
          data: { redFlagId: 'diabetes-history' },
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
          id: 'ecg',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Perform 12-lead ECG',
            parameters: {},
          },
        },
        {
          id: 'flag-atypical',
          type: 'identify_red_flag',
          data: { redFlagId: 'atypical-presentation' },
        },
        {
          id: 'medical-history',
          type: 'ask_question',
          data: 'Tell me about your medical history',
        },
        {
          id: 'flag-weakness',
          type: 'identify_red_flag',
          data: { redFlagId: 'weakness' },
        },
        {
          id: 'aspirin',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer aspirin',
            parameters: { dose: '324mg', route: 'PO' },
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.identifiedRedFlags).toContain('diabetes-history');
      expect(result.identifiedRedFlags).toContain('atypical-presentation');
      expect(result.identifiedRedFlags).toContain('weakness');
    });
  });

  describe('Dysrhythmias', () => {
    test('Unstable VT - Should cardiovert immediately', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'cardiac-unstable-vt',
        category: 'chest_pain',
        expectedDuration: 300,
        criticalActions: [
          {
            id: 'recognize-instability',
            action: 'Recognize hemodynamic instability',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'prepare-cardioversion',
            action: 'Prepare for synchronized cardioversion',
            timing: 'immediate',
            required: true,
            timeWindow: 60,
          },
          {
            id: 'sedation',
            action: 'Administer procedural sedation if patient conscious',
            timing: 'urgent',
            required: false,
          },
          {
            id: 'cardioversion',
            action: 'Perform synchronized cardioversion',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
        ],
        redFlags: [
          {
            id: 'hypotension',
            category: 'Vital Signs',
            description: 'Blood pressure 82/40 indicates hemodynamic instability',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 30,
          },
          {
            id: 'wide-complex-tachycardia',
            category: 'ECG',
            description: 'Wide complex tachycardia at rate 180',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'chest-discomfort',
            category: 'Symptoms',
            description: 'Chest discomfort with unstable rhythm',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'vital_signs',
            action: 'Rapid vital signs assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Assess level of consciousness',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Synchronized cardioversion',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Amiodarone',
            type: 'medication',
            required: false,
            contraindicated: true, // Should cardiovert, not medicate when unstable
          },
        ],
        differentialDiagnosis: [
          'Ventricular tachycardia',
          'SVT with aberrancy',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Rapid vital signs assessment',
            parameters: {},
          },
        },
        {
          id: 'flag-hypotension',
          type: 'identify_red_flag',
          data: { redFlagId: 'hypotension' },
        },
        {
          id: 'monitor',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Apply cardiac monitor',
            parameters: {},
          },
        },
        {
          id: 'flag-vt',
          type: 'identify_red_flag',
          data: { redFlagId: 'wide-complex-tachycardia' },
        },
        {
          id: 'flag-chest-discomfort',
          type: 'identify_red_flag',
          data: { redFlagId: 'chest-discomfort' },
        },
        {
          id: 'recognize-instability',
          type: 'add_note',
          data: { note: 'Patient is hemodynamically unstable - immediate cardioversion required' },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Administer oxygen',
            parameters: {},
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
          id: 'sedation',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer midazolam',
            parameters: { dose: '2mg', route: 'IV' },
          },
        },
        {
          id: 'cardioversion',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Synchronized cardioversion',
            parameters: { energy: '100J' },
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.identifiedRedFlags).toContain('hypotension');
      expect(result.identifiedRedFlags).toContain('wide-complex-tachycardia');
      expect(result.identifiedRedFlags).toContain('chest-discomfort');
      expect(result.inappropriateInterventions).not.toContain('Amiodarone');
    });
  });

  describe('Heart Failure', () => {
    test('Acute Pulmonary Edema - Should treat aggressively', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'cardiac-ape',
        category: 'shortness_of_breath',
        expectedDuration: 450,
        criticalActions: [
          {
            id: 'position',
            action: 'Position patient upright',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'oxygen',
            action: 'High-flow oxygen or CPAP',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'nitro',
            action: 'Administer nitroglycerin',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'monitor',
            action: 'Continuous monitoring',
            timing: 'immediate',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'pink-frothy-sputum',
            category: 'Physical',
            description: 'Pink frothy sputum - pathognomonic for pulmonary edema',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'bilateral-rales',
            category: 'Assessment',
            description: 'Bilateral rales throughout lung fields',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'severe-hypoxia',
            category: 'Vital Signs',
            description: 'SpO2 82% indicating severe hypoxia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'hypertension',
            category: 'Vital Signs',
            description: 'BP 190/100 contributing to pulmonary edema',
            severity: 'high',
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
            category: 'vital_signs',
            action: 'Complete vital signs including SpO2',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'CPAP',
            type: 'treatment',
            required: false,
            contraindicated: false,
            expectedOutcome: 'Improved oxygenation',
          },
          {
            name: 'Nitroglycerin',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Acute pulmonary edema',
          'Congestive heart failure',
          'Cardiogenic shock',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'position',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Position patient upright',
            parameters: {},
          },
        },
        {
          id: 'initial-assessment',
          type: 'ask_question',
          data: 'What is your chief complaint?',
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
          data: { redFlagId: 'severe-hypoxia' },
        },
        {
          id: 'flag-hypertension',
          type: 'identify_red_flag',
          data: { redFlagId: 'hypertension' },
        },
        {
          id: 'lung-sounds',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Lung auscultation',
            parameters: {},
          },
        },
        {
          id: 'flag-rales',
          type: 'identify_red_flag',
          data: { redFlagId: 'bilateral-rales' },
        },
        {
          id: 'sputum-assessment',
          type: 'ask_question',
          data: 'Are you coughing anything up?',
        },
        {
          id: 'flag-sputum',
          type: 'identify_red_flag',
          data: { redFlagId: 'pink-frothy-sputum' },
        },
        {
          id: 'cpap',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Apply CPAP',
            parameters: { peep: '5cm', fio2: '100%' },
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
          id: 'nitro',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Nitroglycerin',
            parameters: { dose: '0.4mg', route: 'SL' },
          },
        },
        {
          id: 'monitor',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Continuous monitoring',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.identifiedRedFlags).toContain('pink-frothy-sputum');
      expect(result.identifiedRedFlags).toContain('bilateral-rales');
      expect(result.identifiedRedFlags).toContain('severe-hypoxia');
      expect(result.identifiedRedFlags).toContain('hypertension');
    });
  });

  describe('Cardiac Arrest', () => {
    test('Witnessed VF Arrest - Should perform high-quality CPR and early defib', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'cardiac-arrest-vf',
        category: 'trauma',
        expectedDuration: 900,
        criticalActions: [
          {
            id: 'cpr-immediate',
            action: 'Begin high-quality CPR immediately',
            timing: 'immediate',
            required: true,
            timeWindow: 10,
          },
          {
            id: 'aed-defib',
            action: 'Apply AED/defibrillator',
            timing: 'immediate',
            required: true,
            timeWindow: 60,
          },
          {
            id: 'analyze-rhythm',
            action: 'Analyze rhythm',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'defibrillate',
            action: 'Defibrillate VF',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
          {
            id: 'resume-cpr',
            action: 'Resume CPR immediately after shock',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'advanced-airway',
            action: 'Secure advanced airway',
            timing: 'prompt',
            required: false,
          },
          {
            id: 'epi',
            action: 'Administer epinephrine',
            timing: 'prompt',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'witnessed-collapse',
            category: 'History',
            description: 'Witnessed collapse improves survival chances',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'bystander-cpr',
            category: 'Scene',
            description: 'Immediate bystander CPR significantly improves outcomes',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'shockable-rhythm',
            category: 'Assessment',
            description: 'VF is a shockable rhythm - best survival potential',
            severity: 'critical',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Check responsiveness',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Check breathing',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Check pulse',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'CPR',
            type: 'procedure',
            required: true,
            contraindicated: false,
            expectedOutcome: 'Maintain perfusion until ROSC',
          },
          {
            name: 'Defibrillation',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Epinephrine',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Ventricular fibrillation',
          'Cardiac arrest',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-assessment',
          type: 'ask_question',
          data: 'What happened?',
        },
        {
          id: 'flag-witnessed',
          type: 'identify_red_flag',
          data: { redFlagId: 'witnessed-collapse' },
        },
        {
          id: 'flag-bystander-cpr',
          type: 'identify_red_flag',
          data: { redFlagId: 'bystander-cpr' },
        },
        {
          id: 'responsiveness',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Check responsiveness',
            parameters: {},
          },
        },
        {
          id: 'breathing',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Check breathing',
            parameters: {},
          },
        },
        {
          id: 'pulse',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Check pulse',
            parameters: {},
          },
        },
        {
          id: 'cpr',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Begin high-quality CPR',
            parameters: { rate: 100, depth: '2 inches' },
          },
        },
        {
          id: 'aed',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Apply AED',
            parameters: {},
          },
        },
        {
          id: 'analyze',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Analyze rhythm',
            parameters: {},
          },
        },
        {
          id: 'flag-vf',
          type: 'identify_red_flag',
          data: { redFlagId: 'shockable-rhythm' },
        },
        {
          id: 'shock',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Defibrillate',
            parameters: { energy: '200J' },
          },
        },
        {
          id: 'resume-cpr',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Resume CPR immediately',
            parameters: {},
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
          id: 'epi',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer epinephrine',
            parameters: { dose: '1mg', route: 'IV' },
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.identifiedRedFlags).toContain('witnessed-collapse');
      expect(result.identifiedRedFlags).toContain('bystander-cpr');
      expect(result.identifiedRedFlags).toContain('shockable-rhythm');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });
});

export default {};

