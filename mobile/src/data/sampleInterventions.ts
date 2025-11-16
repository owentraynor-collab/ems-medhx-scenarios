export const sampleInterventions = [
  {
    id: 'iv_access',
    name: 'Establish IV Access',
    category: 'circulation',
    priority: 'urgent',
    icon: 'needle',
    requirements: [
      'IV catheter and supplies',
      'Aseptic technique',
      'Patient consent when appropriate'
    ],
    contraindications: [
      'Local infection at insertion site',
      'Patient refusal'
    ],
    steps: [
      'Explain procedure to patient',
      'Gather necessary equipment',
      'Select appropriate insertion site',
      'Apply tourniquet',
      'Clean site with antiseptic',
      'Insert IV catheter',
      'Connect IV tubing',
      'Secure catheter and tubing',
      'Document procedure'
    ],
    rationale: 'Establishing IV access ensures rapid medication administration capability and allows for fluid resuscitation if needed.',
    timeToComplete: 5
  },
  {
    id: 'spinal_motion',
    name: 'Spinal Motion Restriction',
    category: 'other',
    priority: 'immediate',
    icon: 'human-cane',
    requirements: [
      'Cervical collar',
      'Long spine board or scoop stretcher',
      'Head blocks and straps'
    ],
    contraindications: [
      'Combative patient',
      'Respiratory distress worsened by supine position'
    ],
    steps: [
      'Maintain manual c-spine stabilization',
      'Assess motor function and sensation',
      'Size and apply cervical collar',
      'Position long board or scoop stretcher',
      'Log roll patient if indicated',
      'Secure patient to board',
      'Apply head blocks',
      'Reassess motor function and sensation'
    ],
    rationale: 'Prevents further injury in patients with suspected spinal trauma.',
    timeToComplete: 10
  },
  {
    id: 'glucose_check',
    name: 'Blood Glucose Check',
    category: 'monitoring',
    priority: 'immediate',
    icon: 'diabetes',
    requirements: [
      'Glucometer',
      'Test strip',
      'Lancet',
      'Alcohol prep pad'
    ],
    contraindications: [],
    steps: [
      'Prepare glucometer and test strip',
      'Clean patient\'s finger with alcohol',
      'Perform finger stick',
      'Obtain blood sample',
      'Apply blood to test strip',
      'Read and record result',
      'Apply bandage to finger stick site'
    ],
    rationale: 'Essential for altered mental status assessment and diabetes-related emergencies.',
    timeToComplete: 2
  },
  {
    id: 'stroke_alert',
    name: 'Activate Stroke Alert',
    category: 'transport',
    priority: 'immediate',
    icon: 'brain',
    requirements: [
      'Radio or phone contact with receiving facility',
      'Stroke assessment findings',
      'Last known well time'
    ],
    contraindications: [],
    steps: [
      'Complete stroke assessment',
      'Document last known well time',
      'Contact receiving facility',
      'Report FAST-ED or other stroke scale findings',
      'Confirm stroke team activation',
      'Document notification time'
    ],
    rationale: 'Early notification allows hospital stroke team preparation and reduces door-to-treatment time.',
    timeToComplete: 3
  },
  {
    id: 'oxygen_therapy',
    name: 'Oxygen Administration',
    category: 'breathing',
    priority: 'immediate',
    icon: 'gas-cylinder',
    requirements: [
      'Oxygen source',
      'Appropriate delivery device',
      'Pulse oximeter'
    ],
    contraindications: [],
    steps: [
      'Check oxygen supply',
      'Select appropriate delivery device',
      'Set appropriate flow rate',
      'Apply to patient',
      'Confirm proper fit and flow',
      'Monitor SpO2',
      'Document intervention'
    ],
    rationale: 'Improves oxygenation in hypoxic patients and respiratory distress.',
    timeToComplete: 2
  }
];

