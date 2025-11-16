/**
 * Toxicology Scenario Tests
 * 
 * Tests for toxicological emergencies including:
 * - Opioid overdose
 * - Stimulant toxicity
 * - Alcohol-related emergencies
 * - Environmental exposures
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from '../ScenarioTestFramework';

describe('Toxicology Scenarios', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  describe('Opioid Emergencies', () => {
    test('Opioid Overdose - Should recognize and treat with naloxone', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'tox-opioid-overdose',
        category: 'toxicology',
        expectedDuration: 300,
        criticalActions: [
          {
            id: 'scene-safety',
            action: 'Ensure scene safety and BSI',
            timing: 'immediate',
            required: true,
            timeWindow: 20,
          },
          {
            id: 'airway-management',
            action: 'Manage airway and ventilation',
            timing: 'immediate',
            required: true,
            timeWindow: 60,
          },
          {
            id: 'ventilate',
            action: 'Provide positive pressure ventilation',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'naloxone',
            action: 'Administer naloxone',
            timing: 'urgent',
            required: true,
            timeWindow: 180,
          },
          {
            id: 'reassess',
            action: 'Reassess after naloxone',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'prepare-repeat',
            action: 'Prepare for repeat naloxone dosing',
            timing: 'urgent',
            required: false,
          },
        ],
        redFlags: [
          {
            id: 'respiratory-depression',
            category: 'Vital Signs',
            description: 'Respiratory rate 4/min - severe respiratory depression',
            severity: 'critical',
            shouldBeIdentified: true,
            identificationTimeWindow: 30,
          },
          {
            id: 'pinpoint-pupils',
            category: 'Physical',
            description: 'Pinpoint pupils - classic opioid toxidrome',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'decreased-loc',
            category: 'Mental Status',
            description: 'GCS 6 - severely altered mental status',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'cyanosis',
            category: 'Physical',
            description: 'Central cyanosis from inadequate ventilation',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'drug-paraphernalia',
            category: 'Scene',
            description: 'Visible drug paraphernalia - confirms suspicion',
            severity: 'medium',
            shouldBeIdentified: true,
          },
        ],
        assessmentChecks: [
          {
            category: 'physical',
            action: 'Pupil assessment',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'vital_signs',
            action: 'Respiratory rate and effort',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Skin color and perfusion',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Substance use history from bystanders',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Naloxone',
            type: 'medication',
            required: true,
            contraindicated: false,
          },
          {
            name: 'BVM ventilation',
            type: 'procedure',
            required: true,
            contraindicated: false,
          },
          {
            name: 'Oxygen',
            type: 'treatment',
            required: true,
            contraindicated: false,
          },
        ],
        differentialDiagnosis: [
          'Opioid overdose',
          'Mixed substance overdose',
          'Hypoglycemia',
          'Stroke',
          'Head trauma',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-approach',
          type: 'ask_question',
          data: 'Is the scene safe? Any weapons or hazards?',
        },
        {
          id: 'bsi',
          type: 'add_note',
          data: { note: 'BSI precautions - gloves, potential for body fluids' },
        },
        {
          id: 'flag-paraphernalia',
          type: 'identify_red_flag',
          data: { redFlagId: 'drug-paraphernalia' },
        },
        {
          id: 'initial-impression',
          type: 'ask_question',
          data: 'What happened?',
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
          id: 'flag-loc',
          type: 'identify_red_flag',
          data: { redFlagId: 'decreased-loc' },
        },
        {
          id: 'airway-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess airway patency',
            parameters: {},
          },
        },
        {
          id: 'breathing-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess respiratory rate and effort',
            parameters: {},
          },
        },
        {
          id: 'flag-respiratory',
          type: 'identify_red_flag',
          data: { redFlagId: 'respiratory-depression' },
        },
        {
          id: 'skin-assessment',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess skin color',
            parameters: {},
          },
        },
        {
          id: 'flag-cyanosis',
          type: 'identify_red_flag',
          data: { redFlagId: 'cyanosis' },
        },
        {
          id: 'pupil-check',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Pupil size and reaction',
            parameters: {},
          },
        },
        {
          id: 'flag-pupils',
          type: 'identify_red_flag',
          data: { redFlagId: 'pinpoint-pupils' },
        },
        {
          id: 'airway-maneuver',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Head tilt-chin lift',
            parameters: {},
          },
        },
        {
          id: 'ventilate',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'BVM ventilation with high-flow oxygen',
            parameters: { rate: '10-12/min', fio2: '100%' },
          },
        },
        {
          id: 'bystander-history',
          type: 'ask_question',
          data: 'Do you know what substances he used?',
        },
        {
          id: 'naloxone',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer naloxone',
            parameters: { dose: '2mg', route: 'IN' },
          },
        },
        {
          id: 'wait',
          type: 'wait',
          data: { duration: 100 }, // Simulated wait for naloxone effect
        },
        {
          id: 'reassess',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Reassess respiratory rate and consciousness',
            parameters: {},
          },
        },
        {
          id: 'prepare-repeat',
          type: 'add_note',
          data: { note: 'Prepared additional naloxone dose if needed - long-acting opioids may require repeat dosing' },
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
        {
          id: 'transport',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Transport for evaluation',
            parameters: {},
          },
        },
        {
          id: 'note-withdrawal',
          type: 'add_note',
          data: { note: 'Monitor for opioid withdrawal symptoms and re-sedation' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.identifiedRedFlags).toContain('respiratory-depression');
      expect(result.identifiedRedFlags).toContain('pinpoint-pupils');
      expect(result.identifiedRedFlags).toContain('decreased-loc');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });

  describe('Behavioral Emergencies', () => {
    test('Excited Delirium - Should recognize and manage safely', async () => {
      const config: ScenarioTestConfig = {
        scenarioId: 'tox-excited-delirium',
        category: 'toxicology',
        expectedDuration: 420,
        criticalActions: [
          {
            id: 'scene-safety',
            action: 'Ensure scene safety and request law enforcement',
            timing: 'immediate',
            required: true,
            timeWindow: 20,
          },
          {
            id: 'recognize-syndrome',
            action: 'Recognize excited delirium syndrome',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'avoid-prone',
            action: 'Avoid prone restraint position',
            timing: 'immediate',
            required: true,
          },
          {
            id: 'vitals',
            action: 'Assess vital signs when safe',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'cooling',
            action: 'Initiate cooling measures',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'chemical-restraint',
            action: 'Consider chemical restraint',
            timing: 'urgent',
            required: true,
          },
          {
            id: 'continuous-monitoring',
            action: 'Continuous monitoring after restraint',
            timing: 'immediate',
            required: true,
          },
        ],
        redFlags: [
          {
            id: 'extreme-agitation',
            category: 'Behavioral',
            description: 'Extreme agitation and aggression - hallmark of ExDS',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'superhuman-strength',
            category: 'Behavioral',
            description: 'Apparent superhuman strength',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'hyperthermia',
            category: 'Vital Signs',
            description: 'Temperature 104°F - critical hyperthermia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'tachycardia',
            category: 'Vital Signs',
            description: 'Heart rate 156 - severe tachycardia',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'diaphoresis',
            category: 'Physical',
            description: 'Profuse diaphoresis',
            severity: 'high',
            shouldBeIdentified: true,
          },
          {
            id: 'police-struggle',
            category: 'Scene',
            description: 'Prolonged struggle with police - high risk',
            severity: 'critical',
            shouldBeIdentified: true,
          },
          {
            id: 'stimulant-use',
            category: 'History',
            description: 'Suspected stimulant use',
            severity: 'high',
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
            category: 'vital_signs',
            action: 'Heart rate and rhythm',
            priority: 'critical',
            mustPerform: true,
          },
          {
            category: 'physical',
            action: 'Assess for injuries from struggle',
            priority: 'important',
            mustPerform: true,
          },
          {
            category: 'history',
            action: 'Substance use history from witnesses',
            priority: 'important',
            mustPerform: true,
          },
        ],
        interventionChecks: [
          {
            name: 'Ketamine',
            type: 'medication',
            required: false,
            contraindicated: false, // First-line for chemical restraint
          },
          {
            name: 'Midazolam',
            type: 'medication',
            required: false,
            contraindicated: false, // Alternative chemical restraint
          },
          {
            name: 'Haloperidol',
            type: 'medication',
            required: false,
            contraindicated: false, // Can be used but slower onset
          },
        ],
        differentialDiagnosis: [
          'Excited delirium syndrome',
          'Stimulant intoxication',
          'Hypoglycemia',
          'Thyroid storm',
          'Psychiatric emergency',
        ],
      };

      const userActions: TestUserAction[] = [
        {
          id: 'scene-assessment',
          type: 'ask_question',
          data: 'What is the situation? Are there weapons? Is the scene secure?',
        },
        {
          id: 'request-pd',
          type: 'add_note',
          data: { note: 'Requested law enforcement backup for scene safety' },
        },
        {
          id: 'observe-behavior',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Observe patient behavior from safe distance',
            parameters: {},
          },
        },
        {
          id: 'flag-agitation',
          type: 'identify_red_flag',
          data: { redFlagId: 'extreme-agitation' },
        },
        {
          id: 'flag-strength',
          type: 'identify_red_flag',
          data: { redFlagId: 'superhuman-strength' },
        },
        {
          id: 'flag-police-struggle',
          type: 'identify_red_flag',
          data: { redFlagId: 'police-struggle' },
        },
        {
          id: 'witness-history',
          type: 'ask_question',
          data: 'Has he used any drugs? What happened before this started?',
        },
        {
          id: 'flag-stimulant',
          type: 'identify_red_flag',
          data: { redFlagId: 'stimulant-use' },
        },
        {
          id: 'recognize-syndrome',
          type: 'add_note',
          data: { note: 'EXCITED DELIRIUM SYNDROME recognized - extreme agitation, hyperthermia risk, sudden death risk' },
        },
        {
          id: 'restrain-safely',
          type: 'add_note',
          data: { note: 'Coordinating with law enforcement for safe restraint - AVOIDING PRONE POSITION' },
        },
        {
          id: 'position-note',
          type: 'add_note',
          data: { note: 'Patient positioned on side or sitting - never prone due to asphyxia risk' },
        },
        {
          id: 'assess-temp',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Assess temperature',
            parameters: {},
          },
        },
        {
          id: 'flag-hyperthermia',
          type: 'identify_red_flag',
          data: { redFlagId: 'hyperthermia' },
        },
        {
          id: 'flag-diaphoresis',
          type: 'identify_red_flag',
          data: { redFlagId: 'diaphoresis' },
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
          id: 'flag-tachycardia',
          type: 'identify_red_flag',
          data: { redFlagId: 'tachycardia' },
        },
        {
          id: 'cooling',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'Initiate cooling - remove excess clothing, cool environment, cool packs',
            parameters: {},
          },
        },
        {
          id: 'chemical-restraint',
          type: 'perform_intervention',
          data: {
            type: 'medication',
            name: 'Administer ketamine for chemical restraint',
            parameters: { dose: '5mg/kg', route: 'IM' },
          },
        },
        {
          id: 'continuous-monitoring',
          type: 'add_note',
          data: { note: 'CONTINUOUS monitoring after sedation - high risk of sudden cardiac arrest' },
        },
        {
          id: 'capnography',
          type: 'perform_intervention',
          data: {
            type: 'assessment',
            name: 'Apply capnography monitoring',
            parameters: {},
          },
        },
        {
          id: 'iv-access',
          type: 'perform_intervention',
          data: {
            type: 'procedure',
            name: 'Establish IV access',
            parameters: {},
          },
        },
        {
          id: 'fluid-bolus',
          type: 'perform_intervention',
          data: {
            type: 'treatment',
            name: 'IV fluid bolus for hyperthermia',
            parameters: { volume: '500ml' },
          },
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
          id: 'hospital-notification',
          type: 'add_note',
          data: { note: 'Notified ED of excited delirium - critical hyperthermia, sudden death risk' },
        },
      ];

      const result = await framework.testScenario(config, userActions);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.identifiedRedFlags).toContain('extreme-agitation');
      expect(result.identifiedRedFlags).toContain('hyperthermia');
      expect(result.identifiedRedFlags).toContain('police-struggle');
      expect(result.missedCriticalActions.length).toBe(0);
    });
  });
});

export default {};

