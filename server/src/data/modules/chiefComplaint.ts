export const chiefComplaintModule = {
  title: "The Chief Complaint: Foundation of EMS Patient Assessment",
  type: "chief_complaint",
  description: "This educational module provides EMS clinicians with an in-depth understanding of the role, purpose, and application of the Chief Complaint (CC) in prehospital care. It integrates clinical reasoning, documentation standards, and educational strategies to improve assessment accuracy and patient outcomes.",
  content: `
# The Chief Complaint: Foundation of EMS Patient Assessment

## 1. Definition and Conceptual Importance

The Chief Complaint (CC) is the primary symptom, concern, or reason the patient—or someone on their behalf—requests EMS evaluation or treatment. It is recorded in the patient's own words whenever possible and anchors all subsequent clinical reasoning, decision-making, and communication.

It differs from the impression or diagnosis in that the CC expresses the patient's perception of their condition, not the provider's interpretation. Recognizing this distinction supports patient-centered care and accurate documentation.

## 2. Operational Relevance in EMS

The Chief Complaint serves as the operational and clinical starting point for EMS. It informs dispatch coding, triage decisions, protocol selection, and clinical pathways. Structured data systems like NEMSIS include a dedicated data element for CC (eSituation.04).

### Operational Functions and Roles:

| Function | Role of Chief Complaint |
|----------|------------------------|
| Dispatch / 911 Call-Taking | Determines priority level and response configuration |
| Triage | Guides hospital notification and destination decisions |
| Documentation | NEMSIS eSituation.04 - ensures data integrity |
| Protocol Selection | Activates condition-specific clinical pathways |

## 3. Interviewing for the Chief Complaint

Effective EMS clinicians obtain the chief complaint through open-ended questions, empathetic listening, and scene awareness. Key techniques include:

- Ask, "What made you call 911 today?" or "What's bothering you most right now?"
- Allow the patient to speak freely before clarifying details
- If the patient is unable to communicate, document proxy reports (family, bystanders)
`,
  order: 1,
  active: true
};

