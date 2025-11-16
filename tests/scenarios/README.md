# EMS MedHx Clinical Scenario Testing Framework

[![Tests](https://github.com/owentraynor-collab/ems-medhx-scenarios/actions/workflows/scenario-tests.yml/badge.svg)](https://github.com/owentraynor-collab/ems-medhx-scenarios/actions)
[![Test Count](https://img.shields.io/badge/tests-31%20passing-brightgreen)](https://github.com/owentraynor-collab/ems-medhx-scenarios)
[![Coverage](https://img.shields.io/badge/coverage-79%25-green)](https://github.com/owentraynor-collab/ems-medhx-scenarios)
[![Speed](https://img.shields.io/badge/speed-3.5s-blue)](https://github.com/owentraynor-collab/ems-medhx-scenarios)
[![Categories](https://img.shields.io/badge/categories-7-orange)](https://github.com/owentraynor-collab/ems-medhx-scenarios)

A comprehensive testing framework for validating clinical educational scenarios across all medical categories including cardiovascular, neurological, trauma, and general medical emergencies.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Test Configuration](#test-configuration)
- [Coverage Reports](#coverage-reports)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This testing framework validates that clinical scenarios:
- Include all critical assessment steps
- Identify important red flags
- Perform appropriate interventions
- Avoid contraindicated treatments
- Follow proper clinical protocols
- Provide accurate educational feedback

## ✨ Features

- **Comprehensive Coverage**: Tests for 31 clinical scenarios across 7 major categories (Cardiovascular, Medical, Trauma, Neurological, Toxicology, Pediatric, Obstetrics)
- **Automated Validation**: Verifies critical actions, red flag identification, and assessment completeness
- **Performance Metrics**: Scoring system based on clinical competency
- **Detailed Reporting**: Identifies missed actions, inappropriate interventions, and areas for improvement
- **Extensible Framework**: Easy to add new scenarios and test cases
- **CI/CD Integration**: Ready for continuous integration pipelines with GitHub Actions

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TypeScript

### Setup

1. Navigate to the scenarios test directory:
```bash
cd tests/scenarios
```

2. Install dependencies:
```bash
npm install
```

3. Verify installation:
```bash
npm test -- --version
```

## 🚀 Quick Start

### Run All Tests

```bash
npm test
```

### Run Category-Specific Tests

```bash
# Cardiovascular scenarios
npm run test:cardiovascular

# Neurological scenarios
npm run test:neurological

# Trauma scenarios
npm run test:trauma

# Medical/general scenarios
npm run test:medical
```

### Run with Coverage

```bash
npm run test:coverage
```

### Watch Mode (for development)

```bash
npm run test:watch
```

## 📁 Test Structure

```
tests/scenarios/
├── ScenarioTestFramework.ts          # Core testing framework
├── cardiovascular/
│   └── CardiovascularScenarios.test.ts
├── neurological/
│   └── NeurologicalScenarios.test.ts
├── trauma/
│   └── TraumaScenarios.test.ts
├── medical/
│   └── MedicalScenarios.test.ts
├── jest.config.js                     # Jest configuration
├── test-setup.ts                      # Test environment setup
├── run-tests.sh                       # Convenience script
└── README.md                          # This file
```

## 🧪 Running Tests

### Using npm Scripts

```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- cardiovascular/CardiovascularScenarios.test.ts

# Run specific test suite
npm test -- -t "Acute Coronary Syndromes"

# Run single test
npm test -- -t "Classic STEMI"
```

### Using the Shell Script

```bash
# Make script executable (first time only)
chmod +x run-tests.sh

# Run all tests
./run-tests.sh

# Run specific category
./run-tests.sh --category cardiovascular

# Run with coverage
./run-tests.sh --coverage

# Watch mode
./run-tests.sh --watch

# Get help
./run-tests.sh --help
```

### CI/CD Integration

```bash
# For continuous integration
npm run test:ci
```

## ✍️ Writing New Tests

### Basic Test Structure

```typescript
import ScenarioTestFramework, { 
  ScenarioTestConfig, 
  TestUserAction 
} from '../ScenarioTestFramework';

describe('Your Scenario Category', () => {
  let framework: ScenarioTestFramework;

  beforeEach(() => {
    framework = new ScenarioTestFramework();
  });

  test('Scenario Name - Should validate expected behavior', async () => {
    // 1. Define scenario configuration
    const config: ScenarioTestConfig = {
      scenarioId: 'unique-scenario-id',
      category: 'chest_pain',
      expectedDuration: 420,
      criticalActions: [
        {
          id: 'action-id',
          action: 'Description of critical action',
          timing: 'immediate',
          required: true,
          timeWindow: 60,
        },
      ],
      redFlags: [
        {
          id: 'red-flag-id',
          category: 'Physical',
          description: 'Description of red flag',
          severity: 'critical',
          shouldBeIdentified: true,
        },
      ],
      assessmentChecks: [
        {
          category: 'history',
          action: 'SAMPLE history',
          priority: 'critical',
          mustPerform: true,
        },
      ],
      interventionChecks: [
        {
          name: 'Aspirin',
          type: 'medication',
          required: true,
          contraindicated: false,
        },
      ],
      differentialDiagnosis: [
        'Diagnosis 1',
        'Diagnosis 2',
      ],
    };

    // 2. Define user actions
    const userActions: TestUserAction[] = [
      {
        id: 'action-1',
        type: 'ask_question',
        data: 'What is your chief complaint?',
      },
      {
        id: 'action-2',
        type: 'perform_intervention',
        data: {
          type: 'assessment',
          name: 'Obtain vital signs',
          parameters: {},
        },
      },
      {
        id: 'action-3',
        type: 'identify_red_flag',
        data: { redFlagId: 'red-flag-id' },
      },
    ];

    // 3. Run test
    const result = await framework.testScenario(config, userActions);

    // 4. Verify results
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(85);
    expect(result.identifiedRedFlags).toContain('red-flag-id');
    expect(result.missedCriticalActions).toHaveLength(0);
  });
});
```

### Action Types

1. **ask_question**: Gather patient information
```typescript
{
  id: 'chief-complaint',
  type: 'ask_question',
  data: 'What is your chief complaint?',
}
```

2. **perform_intervention**: Execute clinical actions
```typescript
{
  id: 'vitals',
  type: 'perform_intervention',
  data: {
    type: 'assessment',
    name: 'Obtain vital signs',
    parameters: {},
  },
}
```

3. **identify_red_flag**: Recognize critical findings
```typescript
{
  id: 'flag-identification',
  type: 'identify_red_flag',
  data: { redFlagId: 'stridor' },
}
```

4. **add_note**: Document findings
```typescript
{
  id: 'note',
  type: 'add_note',
  data: { note: 'Patient presenting with chest pain' },
}
```

5. **wait**: Simulate time passage
```typescript
{
  id: 'wait-for-response',
  type: 'wait',
  data: { duration: 30000 }, // 30 seconds
}
```

## ⚙️ Test Configuration

### Critical Actions

Define actions that must be performed:

```typescript
criticalActions: [
  {
    id: 'unique-id',
    action: 'Description',
    timing: 'immediate' | 'urgent' | 'prompt' | 'delayed',
    required: true,
    timeWindow?: 60, // seconds
    verifyFn?: (state) => boolean, // custom verification
  },
]
```

### Red Flags

Define clinical findings that should be identified:

```typescript
redFlags: [
  {
    id: 'unique-id',
    category: 'Physical' | 'History' | 'Vital Signs' | 'ECG',
    description: 'Clinical significance',
    severity: 'low' | 'medium' | 'high' | 'critical',
    shouldBeIdentified: true,
    identificationTimeWindow?: 120, // seconds
  },
]
```

### Assessment Checks

Define required assessment components:

```typescript
assessmentChecks: [
  {
    category: 'history' | 'physical' | 'vital_signs',
    action: 'Assessment description',
    priority: 'critical' | 'important' | 'supportive',
    mustPerform: true,
    verifyFn?: (interventions) => boolean,
  },
]
```

### Intervention Checks

Define appropriate/contraindicated interventions:

```typescript
interventionChecks: [
  {
    name: 'Intervention name',
    type: 'assessment' | 'treatment' | 'medication' | 'procedure',
    required: true,
    contraindicated: false,
    expectedOutcome?: 'Expected result',
    verifyEffectiveness?: (result) => boolean,
  },
]
```

## 📊 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View HTML Report

```bash
npm run report
```

Coverage reports include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Reports are generated in `coverage/` directory.

## 🎯 Best Practices

### 1. Test Organization

- Group related scenarios in describe blocks
- Use descriptive test names
- Keep tests focused and independent

### 2. Action Sequences

- Follow realistic clinical workflows
- Include appropriate think time between actions
- Document reasoning with notes

### 3. Red Flag Identification

- Identify all critical findings
- Consider time-sensitive recognitions
- Use appropriate severity levels

### 4. Assessment Completeness

- Include systematic assessments (OPQRST, SAMPLE)
- Test both required and optional components
- Verify proper sequencing

### 5. Error Handling

- Test contraindicated interventions
- Verify missed critical actions are caught
- Validate scoring system

## 🔧 Troubleshooting

### Common Issues

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in jest.config.js
testTimeout: 60000 // Increase to 60 seconds
```

**Issue**: Module not found errors
```bash
# Solution: Check moduleNameMapper in jest.config.js
# Or install missing dependencies
npm install
```

**Issue**: TypeScript errors
```bash
# Solution: Check tsconfig.json
# Make sure all type definitions are installed
npm install --save-dev @types/jest @types/node
```

**Issue**: Coverage not generating
```bash
# Solution: Check collectCoverageFrom in jest.config.js
# Make sure paths are correct
```

## 📈 Test Results Interpretation

### Scoring System

- **90-100**: Excellent - All critical actions completed, red flags identified
- **80-89**: Good - Minor omissions, no critical errors
- **70-79**: Adequate - Some missed assessments or minor errors
- **60-69**: Needs Improvement - Missed critical actions or inappropriate interventions
- **< 60**: Fail - Critical errors or contraindicated treatments

### Result Fields

- `passed`: Boolean indicating overall pass/fail
- `score`: Numerical score (0-100)
- `duration`: Time taken in seconds
- `completedActions`: Array of completed action IDs
- `missedCriticalActions`: Array of missed critical actions
- `identifiedRedFlags`: Array of identified red flag IDs
- `missedRedFlags`: Array of missed red flags
- `inappropriateInterventions`: Array of contraindicated interventions performed
- `assessmentCompleteness`: Percentage of required assessments completed
- `errors`: Array of error messages
- `warnings`: Array of warning messages
- `recommendations`: Array of improvement recommendations

## 📝 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [TypeScript Jest](https://kulshekhar.github.io/ts-jest/)
- [EMS Clinical Protocols](../../../docs/UserGuide.md)

## 🤝 Contributing

When adding new scenarios:

1. Create test file in appropriate category directory
2. Follow existing naming conventions
3. Include comprehensive assertions
4. Document any special requirements
5. Run full test suite before committing
6. Update this README if adding new categories

## 📄 License

MIT License - See LICENSE file for details

---

**Need Help?** Contact the EMS MedHx development team or open an issue in the repository.

