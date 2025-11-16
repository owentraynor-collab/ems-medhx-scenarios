/**
 * Trauma Scenario Tests
 * 
 * Tests for trauma-related scenarios including:
 * - Motor vehicle collisions
 * - Falls
 * - Penetrating trauma
 * - Multi-system trauma
 * - Special populations
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Trauma Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  describe('Motor Vehicle Collisions', () => {
    test('Multi-System Trauma - Should prioritize airway in unconscious patient', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-mvc-multisystem',
        category: 'trauma',
        expectedDuration: 600,
        criticalActions: [
          {
            id: 'scene-safety',
            action: 'Assess and ensure scene safety',
            timing: 'immediate',
            required: true,
            timeWindow: 30,
          },
          {
            id: 'c-spine',
            action: 'Establish c-spine precautions',
            timing: 'immediate',
            required: true,
            timeWindow: 45,
          },
          {
            id: 'airway-management',
            action: 'Manage airway in unconscious patient',
            timing: 'immediate',
            required: true,
            timeWindow: 90,
          },
          {
            id: 'oxygen',
            action: 'Administer high-flow oxygen',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'bleeding-control',
            action: 'Control major bleeding',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'rapid-transport',
            action: 'Initiate rapid transport',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'trauma-center',
            action: 'Transport to trauma center',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'unconscious',
            category: 'Mental Status',
            description: 'Unconscious patient requires immediate airway management',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 60,
          },
          {
            id: 'head-trauma',
            category: 'Physical',
            description: 'Obvious head trauma - increased ICP risk',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'femur-fracture',
            category: 'Physical',
            description: 'Femur deformity - risk of significant blood loss',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'labored-breathing',
            category: 'Physical',
            description: 'Labored breathing suggests respiratory compromise',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'high-speed-mvc',
            category: 'Mechanism',
            description: 'High-speed collision - significant energy transfer',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'unrestrained',
            category: 'Mechanism',
            description: 'Unrestrained driver - higher injury severity',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Primary survey (ABCDE)',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Rapid trauma assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Baseline vital signs',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'C-spine immobilization',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Airway management',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Splinting',
            type: 'procedure',
            required: false,
            contraindicated: false, // Can be deferred for rapid transport
          },
        ],
        differentialDiagnosis: [
          'Multi-system trauma',
          'Traumatic brain injury',
          'Hemorrhagic shock',
          'Spinal injury',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-safety-check',
          type: 'ask_question',
          data: 'Is the scene safe? Any hazards?',
        },
        {
          id: 'flag-mechanism',
          type: 'identify_red_flag',
          data: { redFlagId: 'high-speed-mvc' },
        },
        {
          id: 'flag-unrestrained',
          type: 'identify_red_flag',
          data: { redFlagId: 'unrestrained' },
        },
        {
          id: 'c-spine',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Manual c-spine stabilization',
            parameters: {},
          },
        },
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
          id: 'flag-unconscious',
          type: 'identify_red_flag',
          data: { redFlagId: 'unconscious' },
        },
        {
          id: 'airway-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess airway',
            parameters: {},
          },
        },
        {
          id: 'flag-labored-breathing',
          type: 'identify_red_flag',
          data: { redFlagId: 'labored-breathing' },
        },
        {
          id: 'jaw-thrust',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Jaw thrust maneuver',
            parameters: {},
          },
        },
        {
          id: 'oxygen',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'High-flow oxygen',
            parameters: { flow: '15 LPM', device: 'non-rebreather' },
          },
        },
        {
          id: 'breathing-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess breathing',
            parameters: {},
          },
        },
        {
          id: 'circulation',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess circulation',
            parameters: {},
          },
        },
        {
          id: 'rapid-trauma-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Rapid trauma assessment',
            parameters: {},
          },
        },
        {
          id: 'flag-head-trauma',
          type: 'identify_red_flag',
          data: { redFlagId: 'head-trauma' },
        },
        {
          id: 'flag-femur',
          type: 'identify_red_flag',
          data: { redFlagId: 'femur-fracture' },
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
          id: 'bleeding-control',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Control external bleeding',
            parameters: {},
          },
        },
        {
          id: 'collar',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Apply cervical collar',
            parameters: {},
          },
        },
        {
          id: 'backboard',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Spinal immobilization',
            parameters: {},
          },
        },
        {
          id: 'transport-decision',
          type: 'add_note',
          data: { note: 'Load and go - multi-system trauma requires rapid transport' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to trauma center',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(85);
      expect(result.identifiedRedFlags).toContain('unconscious');
      expect(result.identifiedRedFlags).toContain('head-trauma');
      expect(result.identifiedRedFlags).toContain('labored-breathing');
      expect(result.missedCriticalActions).toHaveLength(0);
    });
  });

  describe('Falls', () => {
    test('Elderly Fall - Should recognize anticoagulation risks', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-elderly-fall',
        category: 'trauma',
        expectedDuration: 480,
        criticalActions: [
          {
            id: 'medication-history',
            action: 'Obtain detailed medication history',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'head-to-toe',
            action: 'Complete head-to-toe assessment',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'neuro-assessment',
            action: 'Detailed neurological assessment',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'mechanism-assessment',
            action: 'Determine mechanism and why patient fell',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'anticoagulation',
            category: 'Medication',
            description: 'On blood thinners - high risk of intracranial bleeding',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'elderly',
            category: 'Demographics',
            description: 'Age 82 - increased fall risks and complications',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'head-strike',
            category: 'Mechanism',
            description: 'Struck head on bathroom fixtures',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'time-on-floor',
            category: 'History',
            description: 'Unknown time on floor - rhabdomyolysis risk',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'history',
            action: 'Complete SAMPLE history',
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
            category: 'history',
            action: 'Reason for fall (cardiac, dizzy, trip, etc)',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'Fall with head trauma',
          'Possible intracranial bleeding',
          'Orthopedic injury',
          'Syncope',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'what-happened',
          type: 'ask_question',
          data: 'Can you tell me what happened?',
        },
        {
          id: 'flag-elderly',
          type: 'identify_red_flag',
          data: { redFlagId: 'elderly' },
        },
        {
          id: 'how-fall',
          type: 'ask_question',
          data: 'How did you fall? Did you trip or just go down?',
        },
        {
          id: 'head-strike',
          type: 'ask_question',
          data: 'Did you hit your head?',
        },
        {
          id: 'flag-head-strike',
          type: 'identify_red_flag',
          data: { redFlagId: 'head-strike' },
        },
        {
          id: 'time-down',
          type: 'ask_question',
          data: 'How long were you on the floor?',
        },
        {
          id: 'initial-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'General assessment',
            parameters: {},
          },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Vital signs',
            parameters: {},
          },
        },
        {
          id: 'neuro-exam',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Neurological examination',
            parameters: {},
          },
        },
        {
          id: 'medications',
          type: 'ask_question',
          data: 'What medications do you take?',
        },
        {
          id: 'flag-anticoag',
          type: 'identify_red_flag',
          data: { redFlagId: 'anticoagulation' },
        },
        {
          id: 'head-to-toe',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Complete head-to-toe assessment',
            parameters: {},
          },
        },
        {
          id: 'note',
          type: 'add_note',
          data: { 
            note: 'Elderly fall with head strike, on anticoagulation - high risk for delayed intracranial bleeding' 
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport for evaluation',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('anticoagulation');
      expect(result.identifiedRedFlags).toContain('head-strike');
    });

    test('Industrial Fall from Height - Should assess multi-system trauma', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-industrial-fall',
        category: 'trauma',
        expectedDuration: 600,
        criticalActions: [
          {
            id: 'scene-safety',
            action: 'Ensure scene safety - ongoing hazards',
            timing: 'immediate',
            required: true,
            timeWindow: 30,
          },
          {
            id: 'c-spine',
            action: 'C-spine precautions',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'primary-survey',
            action: 'Complete primary survey',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'spine-assessment',
            action: 'Detailed spinal assessment',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'trauma-center',
            action: 'Transport to trauma center',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'fall-height',
            category: 'Mechanism',
            description: '20-foot fall - significant mechanism',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'spine-injury-risk',
            category: 'Mechanism',
            description: 'High-energy mechanism - spinal injury risk',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'construction-site',
            category: 'Scene',
            description: 'Active construction site - ongoing hazards',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'ABCDE primary survey',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Spinal assessment',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'C-spine immobilization',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Multi-system trauma',
          'Spinal injury',
          'Internal injuries',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-assessment',
          type: 'ask_question',
          data: 'Is the scene safe? Any falling hazards?',
        },
        {
          id: 'flag-construction',
          type: 'identify_red_flag',
          data: { redFlagId: 'construction-site' },
        },
        {
          id: 'mechanism',
          type: 'ask_question',
          data: 'What happened? How far did he fall?',
        },
        {
          id: 'flag-height',
          type: 'identify_red_flag',
          data: { redFlagId: 'fall-height' },
        },
        {
          id: 'flag-spine-risk',
          type: 'identify_red_flag',
          data: { redFlagId: 'spine-injury-risk' },
        },
        {
          id: 'c-spine',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Manual c-spine stabilization',
            parameters: {},
          },
        },
        {
          id: 'primary-survey',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Primary survey (ABCDE)',
            parameters: {},
          },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Vital signs',
            parameters: {},
          },
        },
        {
          id: 'spinal-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Spinal assessment',
            parameters: {},
          },
        },
        {
          id: 'immobilization',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Full spinal immobilization',
            parameters: {},
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to trauma center',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('fall-height');
      expect(result.identifiedRedFlags).toContain('spine-injury-risk');
    });
  });

  describe('Penetrating Trauma', () => {
    test('Stabbing - Should ensure scene safety first', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-stabbing',
        category: 'trauma',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'scene-safety-police',
            action: 'Ensure scene safety with law enforcement',
            timing: 'immediate',
            required: true,
            timeWindow: 30,
          },
          {
            id: 'hemorrhage-control',
            action: 'Control hemorrhage',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'do-not-remove-object',
            action: 'Do not remove impaled object',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'shock-management',
            action: 'Manage for shock',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'rapid-transport',
            action: 'Rapid transport to trauma center',
            timing: 'urgent',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'violent-scene',
            category: 'Scene',
            description: 'Violent crime scene - assailant may still be present',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 20,
          },
          {
            id: 'abdominal-stab',
            category: 'Physical',
            description: 'Abdominal stab wound - high risk of organ damage',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'evisceration-risk',
            category: 'Assessment',
            description: 'Risk of evisceration or significant internal bleeding',
            severity: 'high',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Assess for additional wounds',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Vital signs for shock assessment',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Remove knife',
            type: 'procedure',
            required: false,
            contraindicated: true, // Should NEVER remove impaled objects
          },
          {
            name: 'Direct pressure',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Penetrating abdominal trauma',
          'Hemorrhagic shock',
          'Organ damage',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-check',
          type: 'ask_question',
          data: 'Is scene secure? Is law enforcement on scene?',
        },
        {
          id: 'flag-violent',
          type: 'identify_red_flag',
          data: { redFlagId: 'violent-scene' },
        },
        {
          id: 'wait-police',
          type: 'add_note',
          data: { note: 'Staging until scene secured by police' },
        },
        {
          id: 'approach',
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
          id: 'flag-abdominal',
          type: 'identify_red_flag',
          data: { redFlagId: 'abdominal-stab' },
        },
        {
          id: 'flag-evisceration',
          type: 'identify_red_flag',
          data: { redFlagId: 'evisceration-risk' },
        },
        {
          id: 'additional-wounds',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess for additional wounds',
            parameters: {},
          },
        },
        {
          id: 'hemorrhage-control',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Control hemorrhage with direct pressure',
            parameters: {},
          },
        },
        {
          id: 'stabilize-object',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Stabilize impaled object',
            parameters: {},
          },
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
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Vital signs',
            parameters: {},
          },
        },
        {
          id: 'iv-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish two large-bore IVs',
            parameters: {},
          },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to trauma center',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      console.log('=== STABBING TEST RESULT ===');
      console.log('Passed:', result.passed);
      console.log('Score:', result.score);
      console.log('Missed Critical Actions:', result.missedCriticalActions);
      console.log('Errors:', result.errors);
      console.log('============================\n');

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('violent-scene');
      expect(result.inappropriateInterventions).not.toContain('Remove knife');
      expect(result.score).toBeGreaterThan(85);
    });

    test('Multiple GSW - Should manage for imminent arrest', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-multiple-gsw',
        category: 'trauma',
        expectedDuration: 360,
        criticalActions: [
          {
            id: 'scene-safety',
            action: 'Ensure scene safety with police',
            timing: 'immediate',
            required: true,
            timeWindow: 20,
          },
          {
            id: 'life-threatening-hemorrhage',
            action: 'Control life-threatening hemorrhage',
            timing: 'immediate',
            required: true,
            timeWindow: 60,
          },
          {
            id: 'load-and-go',
            action: 'Immediate load and go decision',
            timing: 'immediate',
            required: true,
            timeWindow: 120,
          },
          {
            id: 'trauma-center',
            action: 'Rapid transport to trauma center',
            timing: 'immediate',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'multiple-gsw',
            category: 'Physical',
            description: 'Multiple gunshot wounds - high mortality risk',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'chest-abdomen',
            category: 'Location',
            description: 'GSWs to chest and abdomen - critical organs at risk',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'imminent-arrest',
            category: 'Clinical',
            description: 'Patient at risk of imminent arrest',
            severity: 'critical',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Rapid primary survey',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Scene time minimization',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Multiple penetrating trauma',
          'Hemorrhagic shock',
          'Tension pneumothorax',
          'Cardiac injury',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-safety',
          type: 'ask_question',
          data: 'Is scene secure?',
        },
        {
          id: 'flag-multiple-gsw',
          type: 'identify_red_flag',
          data: { redFlagId: 'multiple-gsw' },
        },
        {
          id: 'flag-location',
          type: 'identify_red_flag',
          data: { redFlagId: 'chest-abdomen' },
        },
        {
          id: 'primary-survey',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Rapid primary survey',
            parameters: {},
          },
        },
        {
          id: 'flag-critical',
          type: 'identify_red_flag',
          data: { redFlagId: 'imminent-arrest' },
        },
        {
          id: 'hemorrhage-control',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Control external hemorrhage',
            parameters: {},
          },
        },
        {
          id: 'load',
          type: 'add_note',
          data: { note: 'Load and go - critical patient requires immediate surgical intervention' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Rapid transport to trauma center',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('multiple-gsw');
      expect(result.identifiedRedFlags).toContain('imminent-arrest');
      expect(result.duration).toBeLessThan(400); // Should be rapid
    });
  });

  describe('Special Populations', () => {
    test('Pediatric Trauma - Should recognize different assessment needs', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'trauma-pediatric',
        category: 'trauma',
        expectedDuration: 480,
        criticalActions: [
          {
            id: 'age-appropriate-assessment',
            action: 'Perform age-appropriate assessment',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'compensated-shock-recognition',
            action: 'Recognize compensated shock in pediatric patient',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'family-presence',
            action: 'Consider family presence and provide support',
            timing: 'urgent',
            required: false,
          },
        ],
        redFlags: [
          {
            id: 'pediatric-patient',
            category: 'Demographics',
            description: 'Pediatric patient requires different assessment approach',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'child-abuse-concern',
            category: 'History',
            description: 'Mechanism inconsistent with injuries - abuse concern',
            severity: 'high',
            shouldBeIdentified: false, // May not always be apparent
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Pediatric assessment triangle',
            priority: 'critical',
            mustPerform: true,
          },
        ],
        interventionChecks: [],
        differentialDiagnosis: [
          'Pediatric trauma',
          'Compensated shock',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'flag-pediatric',
          type: 'identify_red_flag',
          data: { redFlagId: 'pediatric-patient' },
        },
        {
          id: 'parent-info',
          type: 'ask_question',
          data: 'Can you tell me what happened?',
        },
        {
          id: 'pediatric-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Pediatric assessment triangle',
            parameters: {},
          },
        },
        {
          id: 'vitals',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Age-appropriate vital signs',
            parameters: {},
          },
        },
        {
          id: 'compensated-shock',
          type: 'add_note',
          data: { note: 'Patient showing signs of compensated shock - tachycardia with normal blood pressure' },
        },
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport to pediatric trauma center',
            parameters: {},
          },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.identifiedRedFlags).toContain('pediatric-patient');
    });
  });
});

export default {};

