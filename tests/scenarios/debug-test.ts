/**
 * Debug Test - See what the framework is actually checking
 */

import ScenarioTestFramework, { ScenarioTestConfig, TestUserAction } from './ScenarioTestFramework';

async function runDebugTest() {
  const framework = new ScenarioTestFramework();

  const config: ScenarioTestConfig = {
    scenarioId: 'debug-test',
    category: 'chest_pain',
    expectedDuration: 600,
    criticalActions: [
      {
        id: 'vitals',
        action: 'Obtain vital signs',
        timing: 'immediate',
        required: true,
      },
      {
        id: 'aspirin',
        action: 'Administer aspirin',
        timing: 'immediate',
        required: true,
      },
    ],
    redFlags: [
      {
        id: 'chest-pain',
        category: 'History',
        description: 'Chest pain',
        severity: 'high',
        shouldBeIdentified: true,
      },
    ],
    assessmentChecks: [],
    interventionChecks: [],
    differentialDiagnosis: ['MI'],
  };

  const userActions: TestUserAction[] = [
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
      id: 'aspirin',
      type: 'perform_intervention',
      data: {
        type: 'medication',
        name: 'Administer aspirin',
        parameters: {},
      },
    },
    {
      id: 'flag',
      type: 'identify_red_flag',
      data: { redFlagId: 'chest-pain' },
    },
  ];

  const result = await framework.testScenario(config, userActions);

  console.log('\n=== DEBUG TEST RESULTS ===\n');
  console.log('Passed:', result.passed);
  console.log('Score:', result.score);
  console.log('Duration:', result.duration);
  console.log('\nCompleted Actions:', result.completedActions);
  console.log('Missed Critical Actions:', result.missedCriticalActions);
  console.log('Identified Red Flags:', result.identifiedRedFlags);
  console.log('Missed Red Flags:', result.missedRedFlags);
  console.log('Inappropriate Interventions:', result.inappropriateInterventions);
  console.log('Assessment Completeness:', result.assessmentCompleteness);
  console.log('\nErrors:', result.errors);
  console.log('Warnings:', result.warnings);
  console.log('Recommendations:', result.recommendations);
}

runDebugTest().catch(console.error);

