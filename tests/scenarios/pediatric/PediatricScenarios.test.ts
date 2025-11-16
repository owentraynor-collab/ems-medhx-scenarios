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

    test('Pediatric Sepsis - Should recognize subtle early signs and act urgently', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'peds-sepsis',
        category: 'pediatric',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'recognize-severity',
            action: 'Recognize sick child despite subtle signs',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'rapid-assessment',
            action: 'Perform rapid pediatric assessment',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'establish-access',
            action: 'Establish IV or IO access',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'fluid-resuscitation',
            action: 'Administer fluid bolus',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'source-identification',
            action: 'Identify potential infection source',
            timing: 'urgent',
            required: false, // Important but difficult to match consistently
          },
          {
            id: 'urgent-transport',
            action: 'Rapid transport to pediatric-capable facility',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'parent-concern',
            category: 'History',
            description: 'Parent says "something is just not right" - trust parental instinct',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'lethargy',
            category: 'Mental Status',
            description: 'Unusually lethargic and not interacting normally - concerning behavior',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'tachycardia',
            category: 'Vital Signs',
            description: 'Heart rate 160 in 2-year-old - compensatory tachycardia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'prolonged-cap-refill',
            category: 'Physical',
            description: 'Capillary refill 4 seconds - poor perfusion',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'fever',
            category: 'Vital Signs',
            description: 'Temperature 103.5°F - significant fever',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'decreased-urine',
            category: 'History',
            description: 'No wet diapers in 12 hours - severe dehydration',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'petechiae',
            category: 'Physical',
            description: 'Petechial rash - possible meningococcemia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Pediatric assessment triangle',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Complete pediatric vital signs',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Perfusion assessment (cap refill, skin signs)',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Recent illness history and onset of symptoms',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Fluid bolus (20 mL/kg)',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Antibiotics',
            type: 'medication',
            required: false,
            contraindicated: false, // May be protocol-dependent
          },
        ],
        differentialDiagnosis: [
          'Sepsis/septic shock',
          'Meningococcemia',
          'Viral illness with dehydration',
          'Gastroenteritis',
          'Pneumonia',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'parent-report',
          type: 'ask_question',
          data: 'Tell me what is going on?',
        },
        {
          id: 'flag-parent-concern',
          type: 'identify_red_flag',
          data: { redFlagId: 'parent-concern' },
        },
        {
          id: 'illness-history',
          type: 'ask_question',
          data: 'Has she been sick? When did this start?',
        },
        {
          id: 'general-appearance',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Pediatric assessment triangle - appearance, breathing, circulation',
            parameters: {},
          },
        },
        {
          id: 'flag-lethargy',
          type: 'identify_red_flag',
          data: { redFlagId: 'lethargy' },
        },
        {
          id: 'recognize-sick',
          type: 'add_note',
          data: { note: 'This is a SICK CHILD - subtle signs but concerning presentation, high suspicion for sepsis' },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain pediatric vital signs',
            parameters: {},
          },
        },
        {
          id: 'flag-tachycardia',
          type: 'identify_red_flag',
          data: { redFlagId: 'tachycardia' },
        },
        {
          id: 'flag-fever',
          type: 'identify_red_flag',
          data: { redFlagId: 'fever' },
        },
        {
          id: 'perfusion-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess capillary refill and skin perfusion',
            parameters: {},
          },
        },
        {
          id: 'flag-cap-refill',
          type: 'identify_red_flag',
          data: { redFlagId: 'prolonged-cap-refill' },
        },
        {
          id: 'skin-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Examine skin for rashes',
            parameters: {},
          },
        },
        {
          id: 'flag-petechiae',
          type: 'identify_red_flag',
          data: { redFlagId: 'petechiae' },
        },
        {
          id: 'urine-output',
          type: 'ask_question',
          data: 'When was her last wet diaper?',
        },
        {
          id: 'flag-decreased-urine',
          type: 'identify_red_flag',
          data: { redFlagId: 'decreased-urine' },
        },
        {
          id: 'infection-source',
          type: 'ask_question',
          data: 'Any cough, vomiting, diarrhea, earache? Where do you think the infection started?',
        },
        {
          id: 'sepsis-recognition',
          type: 'add_note',
          data: { note: 'PEDIATRIC SEPSIS - fever, tachycardia, poor perfusion, altered mental status, possible meningococcemia with petechiae' },
        },
        {
          id: 'iv-attempt',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish IV access',
            parameters: { attempts: '2' },
          },
        },
        {
          id: 'io-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'IO access (after failed IV attempts)',
            parameters: { site: 'proximal tibia' },
          },
        },
        {
          id: 'fluid-bolus',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid fluid bolus',
            parameters: { volume: '20 mL/kg', rate: 'wide open' },
          },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Supplemental oxygen',
            parameters: {},
          },
        },
        {
          id: 'continuous-monitoring',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Continuous monitoring',
            parameters: {},
          },
        },
        {
          id: 'rapid-transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to pediatric emergency department',
            parameters: {},
          },
        },
        {
          id: 'hospital-notification',
          type: 'add_note',
          data: { note: 'Notified ED of pediatric sepsis with possible meningococcemia - critical patient, may need antibiotics and PICU' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.identifiedRedFlags).toContain('parent-concern');
      expect(result.identifiedRedFlags).toContain('lethargy');
      expect(result.identifiedRedFlags).toContain('prolonged-cap-refill');
    });

    test('Febrile Seizure - Should reassure parents and rule out serious causes', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'peds-febrile-seizure',
        category: 'pediatric',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'calm-parents',
            action: 'Reassure frightened parents',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'post-ictal-assessment',
            action: 'Assess post-ictal state',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'temperature-check',
            action: 'Check temperature',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'rule-out-meningitis',
            action: 'Assess for signs of meningitis',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'age-appropriate',
            action: 'Verify age-appropriate for febrile seizure',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'transport-evaluation',
            action: 'Transport for medical evaluation',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'high-fever',
            category: 'Vital Signs',
            description: 'Temperature 103.8°F - fever trigger for seizure',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'age-appropriate',
            category: 'Demographics',
            description: '18 months old - typical age for febrile seizures (6mo-5yr)',
            severity: 'medium',
            shouldBeIdentified: true,
          },
          {
            id: 'rapid-fever-rise',
            category: 'History',
            description: 'Rapid temperature rise - classic trigger',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'brief-seizure',
            category: 'History',
            description: 'Brief generalized seizure <5 minutes - typical febrile seizure',
            severity: 'medium',
            shouldBeIdentified: true,
          },
          {
            id: 'post-ictal',
            category: 'Mental Status',
            description: 'Post-ictal but awakening - reassuring sign',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'vital_signs',
            action: 'Temperature assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Neurological examination',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Signs of meningitis (neck stiffness, rash)',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Seizure characteristics and duration',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Antipyretics',
            type: 'medication',
            required: false,
            contraindicated: false,
          },
          {
            name: 'Benzodiazepines',
            type: 'medication',
            required: false,
            contraindicated: false, // Only if seizure continues
          },
        ],
        differentialDiagnosis: [
          'Simple febrile seizure',
          'Complex febrile seizure',
          'Meningitis',
          'Encephalitis',
          'Epilepsy',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'parent-report',
          type: 'ask_question',
          data: 'Tell me what happened',
        },
        {
          id: 'flag-seizure',
          type: 'identify_red_flag',
          data: { redFlagId: 'brief-seizure' },
        },
        {
          id: 'reassure-parents',
          type: 'add_note',
          data: { note: 'Parents extremely frightened - reassuring them that febrile seizures are common and usually benign' },
        },
        {
          id: 'child-age',
          type: 'ask_question',
          data: 'How old is he?',
        },
        {
          id: 'flag-age',
          type: 'identify_red_flag',
          data: { redFlagId: 'age-appropriate' },
        },
        {
          id: 'assess-consciousness',
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
          id: 'neuro-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Brief neurological examination',
            parameters: {},
          },
        },
        {
          id: 'temperature',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain temperature',
            parameters: {},
          },
        },
        {
          id: 'flag-fever',
          type: 'identify_red_flag',
          data: { redFlagId: 'high-fever' },
        },
        {
          id: 'fever-onset',
          type: 'ask_question',
          data: 'When did the fever start? Did it come on quickly?',
        },
        {
          id: 'flag-rapid-rise',
          type: 'identify_red_flag',
          data: { redFlagId: 'rapid-fever-rise' },
        },
        {
          id: 'seizure-details',
          type: 'ask_question',
          data: 'How long did the seizure last? What did it look like?',
        },
        {
          id: 'meningitis-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Check for neck stiffness and petechial rash',
            parameters: {},
          },
        },
        {
          id: 'previous-seizures',
          type: 'ask_question',
          data: 'Has he had seizures before?',
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Obtain full vital signs',
            parameters: {},
          },
        },
        {
          id: 'febrile-seizure-recognition',
          type: 'add_note',
          data: { note: 'Simple febrile seizure - age-appropriate, brief, generalized, rapid fever rise, no meningeal signs' },
        },
        {
          id: 'parent-education',
          type: 'add_note',
          data: { note: 'Educated parents: febrile seizures occur in 2-5% of children, usually benign, but need evaluation to confirm' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport to ED for evaluation',
            parameters: {},
          },
        },
        {
          id: 'hospital-note',
          type: 'add_note',
          data: { note: 'Notified ED of febrile seizure - first episode, needs evaluation to rule out serious causes' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      console.log('=== FEBRILE SEIZURE TEST RESULT ===');
      console.log('Passed:', result.passed);
      console.log('Score:', result.score);
      console.log('Missed Critical Actions:', result.missedCriticalActions);
      console.log('Errors:', result.errors);
      console.log('====================================\n');

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.identifiedRedFlags).toContain('high-fever');
      expect(result.identifiedRedFlags).toContain('brief-seizure');
    });
  });
});

export default {};

