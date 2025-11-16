# Testing Framework Troubleshooting Guide

## Common Issues and Solutions

### Test Timeouts

**Problem:** Tests timing out after 30+ seconds

**Symptoms:**
```
thrown: "Exceeded timeout of 5000 ms for a test."
```

**Root Cause:** 
Real-time `wait` actions in test scenarios that exceed Jest timeout.

**Solution:**
Reduce wait times to simulate (not actually wait for) medication/intervention effects:

```typescript
// ❌ BAD - Causes timeout
{
  type: 'wait',
  data: { duration: 30000 }  // 30 seconds
}

// ✅ GOOD - Fast simulation
{
  type: 'wait',
  data: { duration: 100 }  // 100ms
}
```

**When to use wait actions:**
- Simulating medication onset (benzodiazepines, dextrose)
- Reassessment after intervention
- Time-critical decision points

**Best practice:** Keep waits under 500ms for test performance.

---

### Low Test Scores

**Problem:** Tests passing but scores lower than expected

**Common Causes:**

1. **Missing Red Flag Identifications**
   - Solution: Ensure all critical red flags are identified in userActions

2. **Incomplete Assessment Checks**
   - Solution: Verify OPQRST/SAMPLE questions are asked (need ≥3 elements)

3. **Missed Critical Actions**
   - Solution: Check action name matching (see Matching Patterns below)

**Scoring System:**
- Start: 100 points
- Missed critical action: -20 points each
- Missed red flag: -10 points each
- Incomplete assessment: -20 points max
- Inappropriate intervention: -15 points each

---

### Action Matching Failures

**Problem:** Critical actions marked as "not performed" despite being in test

**Symptoms:**
```
Missed Actions: ['Administer benzodiazepine']
```

**Solution:** Check action name matching patterns:

**Composite Assessments:**
- **OPQRST**: Requires ≥3 pain-related questions (onset, quality, radiation, severity, etc.)
- **SAMPLE**: Requires ≥3 history questions (medications, allergies, past history, events, etc.)

**Medication Classes:**
- **Benzodiazepines**: midazolam, lorazepam, diazepam, versed, ativan
- **Nitroglycerin**: nitro, NTG, nitroglycerin
- **Epinephrine**: epi, epinephrine, adrenaline

**Common Actions:**
- **"Protect airway"** matches: "jaw thrust", "airway management", "suction"
- **"Position patient on side"** matches: "position", "recovery position", "side"
- **"Manage for shock"** requires: ≥2 shock interventions (oxygen, IV, fluids, warmth)

---

### Missing Dependencies

**Problem:** `Cannot find module` errors

**Solution:**
```bash
cd tests/scenarios
rm -rf node_modules package-lock.json
npm install
```

**Common missing modules:**
- `@jest/test-sequencer` - Install: `npm install --save-dev @jest/test-sequencer@29.7.0`
- `ts-jest` - Ensure version matches Jest (29.x)

---

### TypeScript Configuration Errors

**Problem:** `File 'expo/tsconfig.base' not found`

**Solution:**
The test suite has its own `tsconfig.json`. Ensure:
```json
{
  "compilerOptions": {
    "isolatedModules": true,
    // ... other options
  }
}
```

---

## Quick Reference: Running Tests

```bash
# All tests
npm test

# Specific category
npm run test:cardiovascular
npm run test:neurological
npm run test:trauma
npm run test:medical

# With coverage
npm run test:coverage

# Watch mode (for development)
npm run test:watch

# CI mode (no watch, coverage, limited workers)
npm run test:ci
```

---

## Getting Help

**Check test output carefully:**
1. Look at `Errors:` array for specific failures
2. Check `Missed Actions:` for action matching issues
3. Review `Score:` to understand performance
4. Examine `Identified Flags:` vs expected red flags

**Debug a specific test:**
```typescript
const result = await framework.testScenario(config, userActions);
console.log('Debug:', {
  passed: result.passed,
  score: result.score,
  errors: result.errors,
  missedActions: result.missedCriticalActions,
  identifiedFlags: result.identifiedRedFlags
});
```

---

## Known Limitations

1. **Mock Service**: Currently simulates all scenarios generically
2. **Timing Windows**: Not strictly enforced in current implementation
3. **Intervention Effectiveness**: Fixed at 85% in mock
4. **State Changes**: Patient state doesn't dynamically change

These are acceptable for testing scenario structure and completeness but may need enhancement for more realistic simulation.

