export const conditionSpecificInterventions = {
  // Chest Pain Interventions
  chestPainInterventions: [
    {
      id: 'chest_12lead',
      name: '12-Lead ECG',
      category: 'monitoring',
      priority: 'immediate',
      icon: 'heart-pulse',
      requirements: [
        '12-lead ECG monitor',
        'Electrodes',
        'Proper lead placement reference'
      ],
      contraindications: [],
      steps: [
        'Expose chest appropriately',
        'Prep skin if needed',
        'Place electrodes in correct positions',
        'Ensure patient is still and relaxed',
        'Acquire 12-lead ECG',
        'Review for STEMI criteria',
        'Transmit to receiving facility if indicated',
        'Document findings'
      ],
      rationale: 'Essential for identifying STEMI and other cardiac abnormalities.',
      timeToComplete: 5
    },
    {
      id: 'chest_aspirin',
      name: 'Aspirin Administration',
      category: 'medication',
      priority: 'immediate',
      icon: 'pill',
      requirements: [
        'Aspirin 324mg (four 81mg tablets)',
        'Assessment of allergies and contraindications'
      ],
      contraindications: [
        'Known aspirin allergy',
        'Active GI bleeding',
        'Recent major surgery'
      ],
      steps: [
        'Confirm no contraindications',
        'Explain procedure to patient',
        'Administer 324mg chewable aspirin',
        'Document administration time and dose',
        'Monitor for effects'
      ],
      rationale: 'Reduces mortality in acute coronary syndrome by preventing further platelet aggregation.',
      timeToComplete: 2
    },
    {
      id: 'chest_nitro',
      name: 'Nitroglycerin',
      category: 'medication',
      priority: 'urgent',
      icon: 'spray',
      requirements: [
        'Nitroglycerin spray or tablets',
        'Blood pressure monitoring capability'
      ],
      contraindications: [
        'SBP < 100 mmHg',
        'Recent phosphodiesterase inhibitor use',
        'Right ventricular infarct'
      ],
      steps: [
        'Verify BP > 100 systolic',
        'Confirm no contraindications',
        'Administer one spray/tablet sublingually',
        'Monitor BP every 3-5 minutes',
        'Document response',
        'Repeat q5min if needed and BP allows'
      ],
      rationale: 'Reduces cardiac preload and afterload, improving myocardial oxygen supply/demand ratio.',
      timeToComplete: 15
    }
  ],

  // Altered Mental Status Interventions
  amsInterventions: [
    {
      id: 'ams_glucose',
      name: 'Glucose Administration',
      category: 'medication',
      priority: 'immediate',
      icon: 'diabetes',
      requirements: [
        'D50W or D10W',
        'IV access',
        'Blood glucose meter'
      ],
      contraindications: [],
      steps: [
        'Confirm hypoglycemia (<60 mg/dL)',
        'Establish IV access if needed',
        'Administer appropriate glucose concentration',
        'Reassess blood glucose after 5 minutes',
        'Document response',
        'Consider oral glucose if patient improving'
      ],
      rationale: 'Rapidly corrects hypoglycemia in altered mental status.',
      timeToComplete: 10
    },
    {
      id: 'ams_narcan',
      name: 'Naloxone Administration',
      category: 'medication',
      priority: 'immediate',
      icon: 'needle',
      requirements: [
        'Naloxone',
        'Administration supplies (IV/IM/IN)'
      ],
      contraindications: [],
      steps: [
        'Assess respiratory status',
        'Choose administration route',
        'Prepare appropriate dose',
        'Administer medication',
        'Monitor respiratory response',
        'Prepare for potential withdrawal',
        'Document intervention and response'
      ],
      rationale: 'Reverses opioid overdose effects, particularly respiratory depression.',
      timeToComplete: 5
    }
  ],

  // Stroke Interventions
  strokeInterventions: [
    {
      id: 'stroke_assessment',
      name: 'Stroke Scale Assessment',
      category: 'monitoring',
      priority: 'immediate',
      icon: 'brain',
      requirements: [
        'Stroke scale reference',
        'Documentation materials'
      ],
      contraindications: [],
      steps: [
        'Assess level of consciousness',
        'Check gaze deviation',
        'Test visual fields',
        'Assess facial palsy',
        'Check arm drift',
        'Assess grip strength',
        'Test leg strength',
        'Check speech/language',
        'Document findings'
      ],
      rationale: 'Standardizes assessment and helps determine stroke severity and appropriate destination.',
      timeToComplete: 5
    },
    {
      id: 'stroke_notification',
      name: 'Stroke Center Notification',
      category: 'transport',
      priority: 'immediate',
      icon: 'hospital',
      requirements: [
        'Communication equipment',
        'Last known well time',
        'Stroke scale findings'
      ],
      contraindications: [],
      steps: [
        'Determine last known well time',
        'Complete stroke scale',
        'Contact appropriate stroke center',
        'Report assessment findings',
        'Confirm stroke team activation',
        'Document notification time'
      ],
      rationale: 'Early notification reduces door-to-treatment time for potential intervention.',
      timeToComplete: 3
    }
  ],

  // Trauma Interventions
  traumaInterventions: [
    {
      id: 'trauma_spine',
      name: 'Spinal Motion Restriction',
      category: 'other',
      priority: 'immediate',
      icon: 'human-cane',
      requirements: [
        'Cervical collar',
        'Backboard or scoop stretcher',
        'Head blocks and straps'
      ],
      contraindications: [
        'Combative patient',
        'Airway compromise in supine position'
      ],
      steps: [
        'Manual stabilization',
        'Size and apply c-collar',
        'Assess motor/sensory function',
        'Position long board',
        'Log roll if needed',
        'Secure body to board',
        'Apply head blocks',
        'Secure head/neck',
        'Reassess motor/sensory'
      ],
      rationale: 'Prevents secondary injury in patients with potential spinal trauma.',
      timeToComplete: 10
    },
    {
      id: 'trauma_bleeding',
      name: 'Hemorrhage Control',
      category: 'circulation',
      priority: 'immediate',
      icon: 'bandage',
      requirements: [
        'Pressure dressings',
        'Hemostatic gauze',
        'Tourniquets'
      ],
      contraindications: [],
      steps: [
        'Expose wound',
        'Apply direct pressure',
        'Apply pressure dressing',
        'Consider hemostatic agents',
        'Apply tourniquet if indicated',
        'Document time of application',
        'Reassess bleeding control',
        'Monitor distal pulses'
      ],
      rationale: 'Controls life-threatening hemorrhage and prevents shock.',
      timeToComplete: 5
    }
  ],

  // Respiratory Interventions
  respiratoryInterventions: [
    {
      id: 'resp_cpap',
      name: 'CPAP Application',
      category: 'breathing',
      priority: 'immediate',
      icon: 'lungs',
      requirements: [
        'CPAP device',
        'Appropriate mask',
        'Oxygen source'
      ],
      contraindications: [
        'Respiratory arrest',
        'Severe hypotension',
        'Vomiting',
        'Facial trauma'
      ],
      steps: [
        'Explain procedure to patient',
        'Position patient upright',
        'Select appropriate mask size',
        'Connect oxygen',
        'Set initial pressure',
        'Apply mask',
        'Adjust straps',
        'Monitor response',
        'Document intervention'
      ],
      rationale: 'Improves oxygenation and reduces work of breathing in respiratory distress.',
      timeToComplete: 8
    },
    {
      id: 'resp_neb',
      name: 'Nebulizer Treatment',
      category: 'breathing',
      priority: 'urgent',
      icon: 'spray',
      requirements: [
        'Nebulizer kit',
        'Prescribed medication',
        'Oxygen source'
      ],
      contraindications: [],
      steps: [
        'Prepare nebulizer',
        'Add medication',
        'Connect oxygen at 6-8 LPM',
        'Explain procedure',
        'Position patient',
        'Apply mask or mouthpiece',
        'Monitor response',
        'Document intervention'
      ],
      rationale: 'Delivers bronchodilators effectively in respiratory distress.',
      timeToComplete: 10
    }
  ]
};

