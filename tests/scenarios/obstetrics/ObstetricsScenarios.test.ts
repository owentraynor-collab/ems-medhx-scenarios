/**
 * Obstetrics Scenario Tests
 * 
 * Tests for obstetric emergencies including:
 * - Eclampsia
 * - Postpartum hemorrhage
 * - Pregnancy complications
 * - Labor and delivery emergencies
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Obstetrics Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  describe('Pregnancy Complications', () => {
    test('Eclampsia - Should recognize and treat seizures in pregnancy', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'ob-eclampsia',
        category: 'obstetrics',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'airway-protection',
            action: 'Protect airway during and after seizure',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'position-left',
            action: 'Position patient on left side',
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
            id: 'magnesium',
            action: 'Administer magnesium sulfate',
            timing: 'urgent',
            required: true,
            timeWindow: 180,
          },
          {
            id: 'bp-monitoring',
            action: 'Frequent blood pressure monitoring',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'fetal-monitoring',
            action: 'Assess fetal status if possible',
            timing: 'urgent',
            required: false,
          },
          {
            id: 'rapid-transport',
            action: 'Rapid transport to OB-capable facility',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'third-trimester',
            category: 'History',
            description: '34 weeks pregnant - high-risk period for eclampsia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'seizure-activity',
            category: 'Physical',
            description: 'Witnessed tonic-clonic seizure',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'severe-hypertension',
            category: 'Vital Signs',
            description: 'BP 180/110 - severe hypertension',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'headache',
            category: 'Symptoms',
            description: 'Severe headache preceding seizure - warning sign',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'visual-changes',
            category: 'Symptoms',
            description: 'Blurred vision - cerebral involvement',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'post-ictal',
            category: 'Mental Status',
            description: 'Post-ictal confusion - recent seizure',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'vital_signs',
            action: 'Blood pressure assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Neurological status',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Prenatal care and complications history',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Fetal movement/heart tones if equipment available',
            priority: 'important',
            mustPerform: false,
          },
        ],
        interventionChecks: [
          {
            name: 'Magnesium sulfate',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Benzodiazepines',
            type: 'medication',
            required: false,
            contraindicated: false, // Only if seizures continue despite magnesium
          },
          {
            name: 'Antihypertensives',
            type: 'medication',
            required: false,
            contraindicated: false, // May be indicated but definitive care is delivery
          },
        ],
        differentialDiagnosis: [
          'Eclampsia',
          'Severe preeclampsia',
          'Seizure disorder',
          'Intracranial hemorrhage',
          'Stroke',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-info',
          type: 'ask_question',
          data: 'What happened?',
        },
        {
          id: 'flag-seizure',
          type: 'identify_red_flag',
          data: { redFlagId: 'seizure-activity' },
        },
        {
          id: 'pregnancy-question',
          type: 'ask_question',
          data: 'Is she pregnant? How far along?',
        },
        {
          id: 'flag-trimester',
          type: 'identify_red_flag',
          data: { redFlagId: 'third-trimester' },
        },
        {
          id: 'assess-responsiveness',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess level of consciousness',
            parameters: {},
          },
        },
        {
          id: 'flag-post-ictal',
          type: 'identify_red_flag',
          data: { redFlagId: 'post-ictal' },
        },
        {
          id: 'airway-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess and protect airway',
            parameters: {},
          },
        },
        {
          id: 'position-left-side',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Position on left side',
            parameters: { reason: 'prevent supine hypotension, optimize perfusion' },
          },
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
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain vital signs',
            parameters: {},
          },
        },
        {
          id: 'flag-hypertension',
          type: 'identify_red_flag',
          data: { redFlagId: 'severe-hypertension' },
        },
        {
          id: 'symptoms-before',
          type: 'ask_question',
          data: 'Did she have any symptoms before the seizure? Headache? Vision changes?',
        },
        {
          id: 'flag-headache',
          type: 'identify_red_flag',
          data: { redFlagId: 'headache' },
        },
        {
          id: 'flag-visual',
          type: 'identify_red_flag',
          data: { redFlagId: 'visual-changes' },
        },
        {
          id: 'prenatal-care',
          type: 'ask_question',
          data: 'Has she been to a doctor for prenatal care? Any complications?',
        },
        {
          id: 'iv-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish large-bore IV access',
            parameters: { gauge: '18' },
          },
        },
        {
          id: 'magnesium',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer magnesium sulfate',
            parameters: { dose: '4g', route: 'IV', rate: 'slow push over 20 minutes' },
          },
        },
        {
          id: 'monitor',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Continuous cardiac monitoring',
            parameters: {},
          },
        },
        {
          id: 'frequent-bp',
          type: 'add_note',
          data: { note: 'Frequent blood pressure monitoring every 3-5 minutes - eclampsia protocol' },
        },
        {
          id: 'prepare-delivery',
          type: 'add_note',
          data: { note: 'Prepared OB kit - delivery may be imminent, definitive treatment is delivery' },
        },
        {
          id: 'prepare-repeat-seizure',
          type: 'add_note',
          data: { note: 'Prepared additional magnesium and benzodiazepines for recurrent seizure' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to hospital with OB capabilities',
            parameters: {},
          },
        },
        {
          id: 'notify-hospital',
          type: 'add_note',
          data: { note: 'Notified receiving facility of eclampsia - OB team and NICU alerted' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.identifiedRedFlags).toContain('seizure-activity');
      expect(result.identifiedRedFlags).toContain('third-trimester');
      expect(result.identifiedRedFlags).toContain('severe-hypertension');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });
});

export default {};

