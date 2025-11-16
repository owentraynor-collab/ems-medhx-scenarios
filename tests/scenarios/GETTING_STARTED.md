# Getting Started with Scenario Testing

A quick-start guide to running and understanding the EMS MedHx scenario testing framework.

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd tests/scenarios
npm install
```

### 2. Run Your First Test

```bash
# Test a single category
npm run test:cardiovascular

# Or run all tests
npm test
```

### 3. View Results

Tests will display:
- ✓ Passed scenarios (green)
- ✗ Failed scenarios (red)
- Performance scores
- Identified issues

## 📊 What Gets Tested?

### For Each Scenario, We Verify:

1. **Critical Actions** ✅
   - Were all required actions performed?
   - Were they done in appropriate timeframes?
   - Example: Checking blood glucose before giving dextrose

2. **Red Flag Identification** 🚩
   - Were critical findings recognized?
   - Was their significance understood?
   - Example: Recognizing ST elevation on ECG

3. **Assessment Completeness** 📋
   - Was a systematic assessment performed?
   - Were OPQRST/SAMPLE completed?
   - Were physical exams thorough?

4. **Appropriate Interventions** 💊
   - Were correct treatments provided?
   - Were contraindicated treatments avoided?
   - Example: Not giving aspirin before CT in stroke

## 📈 Understanding Test Results

### Scenario Test Output

```
✓ Classic STEMI - Should identify and treat appropriately (2.4s)
  Score: 95/100
  Red Flags Identified: 3/3
  Critical Actions: All completed
  Duration: 8.2 seconds
```

### What the Scores Mean

- **95-100**: Excellent clinical performance
- **85-94**: Good, minor improvements needed  
- **75-84**: Adequate, review recommendations
- **< 75**: Needs significant improvement

### Common Issues Reported

- "Missed critical action: Check blood glucose"
- "Red flag not identified: Bilateral leg weakness"
- "Contraindicated intervention: Administered aspirin"
- "Assessment incomplete: SAMPLE history"

## 🎯 Current Test Coverage

### Cardiovascular (10 scenarios)
- ✓ STEMI recognition and treatment
- ✓ Atypical MI in diabetics
- ✓ Unstable VT management
- ✓ AFib with RVR
- ✓ Acute pulmonary edema
- ✓ Right heart failure
- ✓ VF cardiac arrest
- ✓ PEA with ROSC
- ✓ Pediatric SVT
- ✓ Pregnancy cardiac emergency

### Neurological (8+ scenarios)
- ✓ Acute stroke assessment
- ✓ TIA recognition
- ✓ Status epilepticus
- ✓ First-time seizure
- ✓ Hypoglycemic AMS
- ✓ Toxic AMS
- ✓ And more...

### Trauma (10+ scenarios)
- ✓ Multi-system trauma
- ✓ Entrapped patients
- ✓ Elderly falls
- ✓ Falls from height
- ✓ Penetrating trauma
- ✓ Multiple GSW
- ✓ Pediatric trauma
- ✓ Pregnant trauma patients
- ✓ And more...

### Medical/General (6+ scenarios)
- ✓ Chest pain assessment
- ✓ Respiratory distress
- ✓ Abdominal pain
- ✓ Anaphylaxis
- ✓ Cauda equina syndrome
- ✓ And more...

## 🔍 Example: Reading a Test Failure

```javascript
FAIL cardiovascular/CardiovascularScenarios.test.ts
  ● Classic STEMI - Should identify and treat appropriately

    Expected: true
    Received: false
    
    Errors:
    - Critical action not performed: Perform 12-lead ECG
    - Red flag not identified: st-elevation
    
    Missed Critical Actions:
    - Perform 12-lead ECG (required within 120 seconds)
    
    Recommendations:
    - Review ECG acquisition procedures
    - Practice STEMI recognition
```

**What this means**: 
- The test failed because a 12-lead ECG was not performed
- ST elevation was not recognized as a red flag
- These are time-critical elements for STEMI care

## 💡 Tips for Success

### 1. Start Small
```bash
# Test one scenario at a time
npm test -- -t "Classic STEMI"
```

### 2. Use Watch Mode During Development
```bash
npm run test:watch
# Tests re-run automatically when you save changes
```

### 3. Check Coverage
```bash
npm run test:coverage
# See which scenarios need more test coverage
```

### 4. Read the Recommendations
Every failed test includes specific recommendations for improvement.

## 🛠️ Common Commands Reference

```bash
# Run all tests
npm test

# Run specific category
npm run test:cardiovascular
npm run test:neurological
npm run test:trauma
npm run test:medical

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun)
npm run test:watch

# CI/CD mode
npm run test:ci

# View coverage report
npm run report
```

## 📝 Test Structure Overview

Each test includes:

1. **Scenario Configuration**: Defines what's being tested
2. **User Actions**: Simulates clinician behavior
3. **Verification**: Checks against expected outcomes
4. **Feedback**: Provides specific improvement recommendations

## 🎓 Learning from Tests

Tests serve dual purposes:

1. **Quality Assurance**: Ensure scenarios work correctly
2. **Educational Reference**: Show ideal clinical workflows

Review test files to see:
- Proper assessment sequences
- Critical action timing
- Red flag significance
- Appropriate interventions

## 🚨 When Tests Fail

Don't worry! Failed tests help us improve. They might indicate:

1. **Scenario Issues**: Content may need refinement
2. **Test Issues**: Test expectations may be too strict
3. **Integration Issues**: Services may not be connected properly
4. **Timing Issues**: Actions may need more realistic timeframes

## 📚 Next Steps

1. ✅ Run the test suite
2. ✅ Review any failures
3. ✅ Check the full README for details
4. ✅ Explore individual test files
5. ✅ Consider adding new scenarios

## 🤝 Need Help?

- Check `README.md` for detailed documentation
- Review example tests in each category
- Contact the development team
- Open an issue on GitHub

## 📊 Expected Outcomes

After running the full test suite, you should see:

- **Total Tests**: 30+ scenarios
- **Pass Rate**: Aim for 95%+
- **Average Score**: 85+
- **Coverage**: 80%+ of framework code

---

**Remember**: These tests ensure that our educational scenarios provide high-quality, clinically accurate training for EMS professionals. Every test that passes means better education for providers and better care for patients! 🚑

