interface ScenarioFeedback {
  category: string;
  criticalActions: {
    action: string;
    rationale: string;
    timeTarget: number; // in seconds
  }[];
  redFlagRecognition: {
    finding: string;
    significance: string;
    expectedAction: string;
  }[];
  interventionSequence: {
    priority: 'immediate' | 'urgent' | 'priority' | 'delayed';
    interventions: string[];
    rationale: string;
  }[];
  commonErrors: {
    error: string;
    impact: string;
    correction: string;
  }[];
  excellentCareMarkers: string[];
  learningPoints: string[];
}

export const scenarioFeedbackTemplates: Record<string, ScenarioFeedback> = {
  // Chest Pain Scenario Template
  chest_pain: {
    category: "Chest Pain - Possible ACS",
    criticalActions: [
      {
        action: "12-Lead ECG acquisition",
        rationale: "Early identification of STEMI enables rapid cath lab activation",
        timeTarget: 300 // 5 minutes
      },
      {
        action: "Aspirin administration",
        rationale: "Early aspirin reduces mortality in ACS",
        timeTarget: 600 // 10 minutes
      },
      {
        action: "Hospital notification",
        rationale: "Early notification allows preparation of appropriate resources",
        timeTarget: 900 // 15 minutes
      }
    ],
    redFlagRecognition: [
      {
        finding: "Crushing chest pain with radiation",
        significance: "Classic ACS presentation",
        expectedAction: "Immediate 12-lead ECG and aspirin administration"
      },
      {
        finding: "Diaphoresis with nausea",
        significance: "Autonomic response suggesting ACS",
        expectedAction: "Consider nitroglycerine if BP allows"
      },
      {
        finding: "Hypotension with chest pain",
        significance: "Possible cardiogenic shock",
        expectedAction: "Fluid bolus consideration, immediate transport"
      }
    ],
    interventionSequence: [
      {
        priority: "immediate",
        interventions: ["12-lead ECG", "Aspirin", "Vital signs"],
        rationale: "Immediate diagnosis and mortality reduction"
      },
      {
        priority: "urgent",
        interventions: ["IV access", "Nitroglycerine", "Additional 12-leads"],
        rationale: "Preparation for treatment and monitoring"
      },
      {
        priority: "priority",
        interventions: ["Serial vital signs", "Ongoing assessment"],
        rationale: "Monitor for deterioration"
      }
    ],
    commonErrors: [
      {
        error: "Delayed 12-lead ECG",
        impact: "Delayed recognition of STEMI",
        correction: "Obtain 12-lead within 5 minutes of patient contact"
      },
      {
        error: "Nitroglycerine before 12-lead",
        impact: "May mask STEMI changes",
        correction: "Always obtain initial 12-lead before nitroglycerine"
      }
    ],
    excellentCareMarkers: [
      "12-lead ECG within 5 minutes",
      "Early aspirin administration",
      "Appropriate hospital notification",
      "Serial 12-leads with any changes"
    ],
    learningPoints: [
      "Time is muscle in cardiac emergencies",
      "Early recognition and treatment improves outcomes",
      "Hospital notification is critical for STEMI"
    ]
  },

  // Altered Mental Status Scenario Template
  altered_mental_status: {
    category: "Altered Mental Status",
    criticalActions: [
      {
        action: "Blood glucose check",
        rationale: "Rule out hypoglycemia as cause",
        timeTarget: 180 // 3 minutes
      },
      {
        action: "Airway assessment",
        rationale: "Ensure adequate ventilation",
        timeTarget: 120 // 2 minutes
      },
      {
        action: "Stroke assessment",
        rationale: "Identify possible stroke symptoms",
        timeTarget: 300 // 5 minutes
      }
    ],
    redFlagRecognition: [
      {
        finding: "Unresponsive to stimuli",
        significance: "Possible serious neurological condition",
        expectedAction: "Immediate ABCs and glucose check"
      },
      {
        finding: "Focal neurological deficits",
        significance: "Possible stroke",
        expectedAction: "Complete stroke scale assessment"
      },
      {
        finding: "Signs of toxidrome",
        significance: "Possible overdose",
        expectedAction: "Consider naloxone administration"
      }
    ],
    interventionSequence: [
      {
        priority: "immediate",
        interventions: ["Airway assessment", "Glucose check", "Stroke scale"],
        rationale: "Address life threats and common causes"
      },
      {
        priority: "urgent",
        interventions: ["IV access", "12-lead ECG", "Detailed assessment"],
        rationale: "Prepare for interventions and identify cause"
      }
    ],
    commonErrors: [
      {
        error: "Delayed glucose check",
        impact: "Missed treatable cause of AMS",
        correction: "Check glucose within 3 minutes of patient contact"
      },
      {
        error: "Incomplete neurological exam",
        impact: "Missed stroke symptoms",
        correction: "Complete full stroke scale assessment"
      }
    ],
    excellentCareMarkers: [
      "Early glucose check",
      "Proper airway management",
      "Complete neurological assessment",
      "Appropriate hospital notification"
    ],
    learningPoints: [
      "Always check glucose in AMS",
      "Protect airway in unconscious patients",
      "Consider stroke in acute AMS"
    ]
  },

  // Trauma Scenario Template
  trauma: {
    category: "Trauma Assessment",
    criticalActions: [
      {
        action: "Spinal motion restriction",
        rationale: "Prevent secondary injury",
        timeTarget: 300 // 5 minutes
      },
      {
        action: "Bleeding control",
        rationale: "Prevent hemorrhagic shock",
        timeTarget: 180 // 3 minutes
      },
      {
        action: "Trauma center notification",
        rationale: "Enable appropriate resource preparation",
        timeTarget: 600 // 10 minutes
      }
    ],
    redFlagRecognition: [
      {
        finding: "Mechanism of injury",
        significance: "Predicts potential injuries",
        expectedAction: "Appropriate trauma center triage"
      },
      {
        finding: "Neurological deficits",
        significance: "Possible spinal cord injury",
        expectedAction: "Immediate spinal motion restriction"
      }
    ],
    interventionSequence: [
      {
        priority: "immediate",
        interventions: ["Bleeding control", "Spinal motion restriction", "Primary survey"],
        rationale: "Address immediate life threats"
      },
      {
        priority: "urgent",
        interventions: ["IV access", "Pain management", "Secondary survey"],
        rationale: "Stabilize and prevent deterioration"
      }
    ],
    commonErrors: [
      {
        error: "Delayed transport decision",
        impact: "Increased time to definitive care",
        correction: "Make transport decision within 10 minutes"
      },
      {
        error: "Incomplete assessment",
        impact: "Missed injuries",
        correction: "Complete thorough primary and secondary surveys"
      }
    ],
    excellentCareMarkers: [
      "Rapid bleeding control",
      "Appropriate spinal precautions",
      "Early trauma center notification",
      "Complete trauma assessment"
    ],
    learningPoints: [
      "Mechanism predicts injury patterns",
      "Time is critical in trauma",
      "Early notification improves outcomes"
    ]
  },

  // Stroke Scenario Template
  stroke: {
    category: "Stroke Assessment",
    criticalActions: [
      {
        action: "Stroke scale assessment",
        rationale: "Determine stroke severity",
        timeTarget: 300 // 5 minutes
      },
      {
        action: "Blood glucose check",
        rationale: "Rule out stroke mimics",
        timeTarget: 180 // 3 minutes
      },
      {
        action: "Stroke center notification",
        rationale: "Enable rapid stroke team response",
        timeTarget: 600 // 10 minutes
      }
    ],
    redFlagRecognition: [
      {
        finding: "Sudden onset deficits",
        significance: "Classic stroke presentation",
        expectedAction: "Complete stroke scale"
      },
      {
        finding: "Time last known well",
        significance: "Treatment window determination",
        expectedAction: "Document and report accurately"
      }
    ],
    interventionSequence: [
      {
        priority: "immediate",
        interventions: ["Stroke scale", "Glucose check", "Hospital notification"],
        rationale: "Enable rapid treatment decisions"
      },
      {
        priority: "urgent",
        interventions: ["IV access", "12-lead ECG", "Detailed assessment"],
        rationale: "Prepare for interventions"
      }
    ],
    commonErrors: [
      {
        error: "Incomplete stroke scale",
        impact: "Inaccurate severity assessment",
        correction: "Complete all stroke scale elements"
      },
      {
        error: "Inaccurate last known well time",
        impact: "Incorrect treatment window calculation",
        correction: "Verify time with all available sources"
      }
    ],
    excellentCareMarkers: [
      "Rapid stroke scale completion",
      "Accurate last known well time",
      "Early stroke center notification",
      "Complete documentation"
    ],
    learningPoints: [
      "Time is brain in stroke care",
      "Accurate assessment guides treatment",
      "Early notification improves outcomes"
    ]
  },

  // Respiratory Distress Template
  respiratory_distress: {
    category: "Respiratory Emergency",
    criticalActions: [
      {
        action: "Oxygen administration",
        rationale: "Address hypoxia",
        timeTarget: 120 // 2 minutes
      },
      {
        action: "Position of comfort",
        rationale: "Optimize respiratory effort",
        timeTarget: 180 // 3 minutes
      },
      {
        action: "CPAP consideration",
        rationale: "Reduce work of breathing",
        timeTarget: 600 // 10 minutes
      }
    ],
    redFlagRecognition: [
      {
        finding: "SpO2 < 90%",
        significance: "Severe hypoxia",
        expectedAction: "Immediate oxygen therapy"
      },
      {
        finding: "Accessory muscle use",
        significance: "Increased work of breathing",
        expectedAction: "Consider CPAP/respiratory support"
      }
    ],
    interventionSequence: [
      {
        priority: "immediate",
        interventions: ["Oxygen therapy", "Position of comfort", "Vital signs"],
        rationale: "Address immediate respiratory needs"
      },
      {
        priority: "urgent",
        interventions: ["CPAP", "Medication administration", "IV access"],
        rationale: "Provide definitive interventions"
      }
    ],
    commonErrors: [
      {
        error: "Delayed oxygen administration",
        impact: "Prolonged hypoxia",
        correction: "Provide oxygen within 2 minutes"
      },
      {
        error: "Missed CPAP opportunity",
        impact: "Increased work of breathing",
        correction: "Consider CPAP early in appropriate patients"
      }
    ],
    excellentCareMarkers: [
      "Early oxygen administration",
      "Appropriate positioning",
      "Proper CPAP application",
      "Continuous monitoring"
    ],
    learningPoints: [
      "Early intervention prevents deterioration",
      "Position affects breathing effectiveness",
      "Continuous monitoring is essential"
    ]
  }
};

