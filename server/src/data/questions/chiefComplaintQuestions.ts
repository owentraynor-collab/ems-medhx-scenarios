export const chiefComplaintQuestions = [
  {
    text: "What is the primary purpose of recording a chief complaint?",
    options: [
      "To establish a diagnosis",
      "To record the patient's perception of their condition in their own words",
      "To determine hospital destination",
      "To complete the NEMSIS documentation"
    ],
    correctAnswer: "To record the patient's perception of their condition in their own words",
    explanation: "The chief complaint represents the patient's own perception of their condition and should be recorded in their words, not the provider's interpretation. This forms the foundation for subsequent clinical reasoning and documentation.",
    difficulty: "basic"
  },
  {
    text: "How does the chief complaint differ from the provider's impression?",
    options: [
      "It doesn't differ - they are the same thing",
      "The chief complaint is the patient's perception while the impression is the provider's interpretation",
      "The chief complaint is more detailed than the impression",
      "The chief complaint is only used for documentation purposes"
    ],
    correctAnswer: "The chief complaint is the patient's perception while the impression is the provider's interpretation",
    explanation: "A key distinction exists between the chief complaint, which represents the patient's perception of their condition, and the provider's impression, which is based on clinical assessment and interpretation.",
    difficulty: "basic"
  },
  {
    text: "Which of the following is the best open-ended question to obtain a chief complaint?",
    options: [
      "Are you having chest pain?",
      "What made you call 911 today?",
      "When did your symptoms start?",
      "Have you had this before?"
    ],
    correctAnswer: "What made you call 911 today?",
    explanation: "Open-ended questions like 'What made you call 911 today?' allow patients to express their concerns in their own words without leading them to specific symptoms or conditions.",
    difficulty: "basic"
  },
  {
    text: "In the NEMSIS system, where is the chief complaint documented?",
    options: [
      "eResponse.03",
      "ePatient.02",
      "eSituation.04",
      "eProtocol.01"
    ],
    correctAnswer: "eSituation.04",
    explanation: "The NEMSIS system includes a dedicated data element for the chief complaint under eSituation.04, ensuring standardized documentation across EMS systems.",
    difficulty: "intermediate"
  },
  {
    text: "What operational functions does the chief complaint inform?",
    options: [
      "Only hospital destination decisions",
      "Only protocol selection",
      "Only documentation requirements",
      "Dispatch coding, triage decisions, protocol selection, and clinical pathways"
    ],
    correctAnswer: "Dispatch coding, triage decisions, protocol selection, and clinical pathways",
    explanation: "The chief complaint serves multiple operational functions in EMS, including informing dispatch coding, triage decisions, protocol selection, and determining appropriate clinical pathways.",
    difficulty: "intermediate"
  },
  {
    text: "When a patient cannot communicate, what is the appropriate source for obtaining a chief complaint?",
    options: [
      "Make your best guess based on presentation",
      "Leave it blank in the documentation",
      "Document proxy reports from family or bystanders",
      "Only use vital signs to determine the complaint"
    ],
    correctAnswer: "Document proxy reports from family or bystanders",
    explanation: "When patients cannot communicate, EMS clinicians should obtain and document proxy reports from family members or bystanders who can provide information about the patient's condition or reason for calling 911.",
    difficulty: "intermediate"
  },
  {
    text: "How does the chief complaint influence protocol selection?",
    options: [
      "It has no influence on protocol selection",
      "It activates condition-specific clinical pathways",
      "It only affects hospital notification",
      "It only determines transport priority"
    ],
    correctAnswer: "It activates condition-specific clinical pathways",
    explanation: "The chief complaint plays a crucial role in protocol selection by activating condition-specific clinical pathways that guide patient care and treatment decisions.",
    difficulty: "advanced"
  }
];

