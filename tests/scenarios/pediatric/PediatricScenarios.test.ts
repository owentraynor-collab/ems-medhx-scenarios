/**
 * Pediatric Scenario Tests
 * 
 * Tests for pediatric emergencies including:
 * - Respiratory distress (croup, bronchiolitis)
 * - Febrile seizures
 * - Pediatric sepsis
 * - Special considerations for pediatric patients
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Pediatric Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  describe('Respiratory Emergencies', () => {
    test('Croup with Stridor - Should recognize and treat appropriately', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'peds-croup',
        category: 'pediatric',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'calm-assessment',
            action: 'Keep child calm and assess without agitation',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'pedi-triangle',
            action: 'Perform pediatric assessment triangle',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'oxygen-assessment',
            action: 'Assess oxygenation status',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'stridor-recognition',
            action: 'Recognize inspiratory stridor',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'position-comfort',
            action: 'Position child in position of comfort',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'cool-mist',
            action: 'Provide cool mist oxygen or humidified air',
            timing: 'urgent',
            required: false,
          },
          {
            id: 'parent-involvement',
            action: 'Keep parent with child to reduce anxiety',
            timing: 'immediate',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'stridor',
            category: 'Physical',
            description: 'Inspiratory stridor indicates upper airway obstruction',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'retractions',
            category: 'Physical',
            description: 'Suprasternal and intercostal retractions',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'barky-cough',
            category: 'History',
            description: 'Characteristic "barky/seal-like" cough',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'night-worse',
            category: 'History',
            description: 'Symptoms worse at night - typical croup pattern',
            severity: 'medium',
            shouldBeIdentified: true,
          },
          {
            id: 'age-appropriate',
            category: 'Demographics',
            description: '18 months old - typical age for croup',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Pediatric assessment triangle (appearance, work of breathing, circulation)',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Respiratory rate and effort',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Oxygen saturation',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Symptom onset and progression from parent',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Intubation',
            type: 'procedure',
            required: false,
            contraindicated: false, // Only if absolutely necessary
          },
          {
            name: 'Racemic epinephrine',
            type: 'medication',
            required: false,
            contraindicated: false, // May be indicated for severe cases
          },
        ],
        differentialDiagnosis: [
          'Croup (laryngotracheobronchitis)',
          'Foreign body aspiration',
          'Epiglottitis',
          'Bacterial tracheitis',
          'Anaphylaxis',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'calm-approach',
          type: 'add_note',
          data: { note: 'Approaching calmly, avoiding agitation of distressed child' },
        },
        {
          id: 'parent-history',
          type: 'ask_question',
          data: 'Can you tell me what happened?',
        },
        {
          id: 'onset-question',
          type: 'ask_question',
          data: 'When did the symptoms start?',
        },
        {
          id: 'flag-night',
          type: 'identify_red_flag',
          data: { redFlagId: 'night-worse' },
        },
        {
          id: 'flag-age',
          type: 'identify_red_flag',
          data: { redFlagId: 'age-appropriate' },
        },
        {
          id: 'general-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Pediatric assessment triangle - appearance, breathing, circulation',
            parameters: {},
          },
        },
        {
          id: 'listen-breathing',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Listen for abnormal breath sounds',
            parameters: {},
          },
        },
        {
          id: 'recognize-stridor',
          type: 'add_note',
          data: { note: 'Inspiratory stridor noted - upper airway obstruction' },
        },
        {
          id: 'flag-stridor',
          type: 'identify_red_flag',
          data: { redFlagId: 'stridor' },
        },
        {
          id: 'observe-effort',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Observe work of breathing and retractions',
            parameters: {},
          },
        },
        {
          id: 'flag-retractions',
          type: 'identify_red_flag',
          data: { redFlagId: 'retractions' },
        },
        {
          id: 'cough-history',
          type: 'ask_question',
          data: 'What does the cough sound like?',
        },
        {
          id: 'flag-cough',
          type: 'identify_red_flag',
          data: { redFlagId: 'barky-cough' },
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
          id: 'position-comfort',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Position child in position of comfort on parent lap',
            parameters: {},
          },
        },
        {
          id: 'parent-with-child',
          type: 'add_note',
          data: { note: 'Keeping parent with child to minimize anxiety and agitation' },
        },
        {
          id: 'cool-mist',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Provide cool mist oxygen',
            parameters: { flow: 'blow-by or low flow' },
          },
        },
        {
          id: 'continuous-monitoring',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Continuous monitoring of respiratory status',
            parameters: {},
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport to pediatric-capable facility',
            parameters: {},
          },
        },
        {
          id: 'prepare-advanced',
          type: 'add_note',
          data: { note: 'Prepared for potential airway intervention if deterioration occurs' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.identifiedRedFlags).toContain('stridor');
      expect(result.identifiedRedFlags).toContain('barky-cough');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });
});

export default {};

