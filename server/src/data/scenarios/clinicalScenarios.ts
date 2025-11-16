export const clinicalScenarios = [
  {
    title: "Back Pain with Neurological Symptoms",
    category: "back_pain",
    difficulty: "intermediate",
    setting: "Home setting",
    initialPresentation: {
      dispatchInfo: "68-year-old female with lower back pain",
      sceneDescription: "Patient sitting in recliner, appears uncomfortable",
      patientAppearance: "Alert, anxious, grimacing with movement"
    },
    patientInfo: {
      age: 68,
      gender: "female",
      history: "Breast cancer in remission for 5 years",
      complaint: "Progressive lower back pain for 3 weeks, now with bilateral leg weakness and difficulty urinating"
    },
    vitalSigns: {
      initial: {
        bloodPressure: "142/88",
        heartRate: 88,
        respiratoryRate: 18,
        spO2: 98,
        temperature: 37.2
      }
    },
    redFlags: {
      present: [
        {
          finding: "Progressive neurological deficit (bilateral leg weakness)",
          significance: "Possible cauda equina syndrome",
          requiredAction: "Urgent recognition & transport, document deficits"
        },
        {
          finding: "History of cancer with new back pain",
          significance: "Possible spinal metastasis",
          requiredAction: "Document findings, notify receiving facility"
        },
        {
          finding: "Urinary symptoms with neurological deficits",
          significance: "Suggests cauda equina syndrome",
          requiredAction: "Immediate transport to facility with neurosurgical capabilities"
        }
      ]
    },
    expectedAssessment: {
      category: "physical",
      items: [
        {
          action: "Detailed neurological examination",
          rationale: "Document extent of weakness and sensory changes",
          priority: "critical"
        },
        {
          action: "Assess urinary symptoms",
          rationale: "Key indicator for cauda equina syndrome",
          priority: "critical"
        },
        {
          action: "Pain assessment",
          rationale: "Guide management and document progression",
          priority: "important"
        }
      ]
    },
    correctTreatmentPath: [
      {
        step: 1,
        action: "Complete rapid neurological assessment",
        rationale: "Document deficits for hospital team",
        timing: "immediate"
      },
      {
        step: 2,
        action: "Establish IV access",
        rationale: "Prepare for possible emergency interventions",
        timing: "prompt"
      },
      {
        step: 3,
        action: "Transport to facility with neurosurgical capabilities",
        rationale: "Patient may need immediate surgical intervention",
        timing: "urgent"
      }
    ]
  },
  {
    title: "Altered Mental Status with Unknown Cause",
    category: "altered_mental_status",
    difficulty: "intermediate",
    setting: "Apartment",
    initialPresentation: {
      dispatchInfo: "24-year-old male found confused",
      sceneDescription: "Patient on floor, empty pill bottle nearby",
      patientAppearance: "Diaphoretic, confused, lethargic"
    },
    vitalSigns: {
      initial: {
        bloodPressure: "90/60",
        heartRate: 120,
        respiratoryRate: "shallow",
        spO2: 94
      }
    },
    redFlags: {
      present: [
        {
          finding: "Toxidrome suspicion (pill bottle)",
          significance: "Possible overdose",
          requiredAction: "Poison/toxicology protocols, consider Naloxone"
        },
        {
          finding: "Altered mental status",
          significance: "Multiple possible causes including hypoglycemia",
          requiredAction: "Check glucose immediately"
        },
        {
          finding: "Vital sign abnormalities",
          significance: "Suggests significant physiological disturbance",
          requiredAction: "Immediate stabilization and transport"
        }
      ]
    },
    expectedAssessment: {
      category: "intervention",
      items: [
        {
          action: "Check blood glucose",
          rationale: "Rule out hypoglycemia",
          priority: "critical"
        },
        {
          action: "Assess airway and breathing",
          rationale: "Ensure adequate ventilation",
          priority: "critical"
        },
        {
          action: "Scene safety/pill bottle assessment",
          rationale: "Identify potential toxins",
          priority: "important"
        }
      ]
    }
  }
];

