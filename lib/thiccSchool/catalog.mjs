const section = (id, title, assignedDate, minutes, guide, focus = [], source = 'ISSA PORTAL') => ({
  id, title, assignedDate, minutes, guide, focus, source,
});

const RESERVED_STUDY_DATES = new Set(['2026-12-22']);

const numberedSections = ({ prefix, count, startDate, title, minutes = 150, guide, focus = [], source = 'EDITABLE COURSE MAP' }) => {
  const date = new Date(`${startDate}T12:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    while (RESERVED_STUDY_DATES.has(date.toISOString().slice(0, 10))) date.setUTCDate(date.getUTCDate() + 1);
    const dateKey = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    return section(`${prefix}-${index + 1}`, `${title} ${index + 1}`, dateKey, minutes, guide(index + 1), focus, source);
  });
};

const cptModules = [
  ['cpt-1', 'MODULE 1 · FOUNDATIONS OF HEALTH & BEHAVIOR', '2026-11-16', 300, 'Define the personal trainer scope, health and fitness fundamentals, client-centered communication, motivation, and behavior-change models.', ['scope of practice', 'health and fitness', 'behavior change', 'communication']],
  ['cpt-2', 'MODULE 2 · MOVEMENT & SUPPORTING SYSTEMS', '2026-11-17', 300, 'Trace how the skeletal, muscular, nervous, cardiovascular, respiratory, and endocrine systems support movement and adaptation.', ['anatomy', 'physiology', 'movement systems', 'homeostasis']],
  ['cpt-3', 'MODULE 3 · BIOMECHANICS & MOVEMENT PRINCIPLES', '2026-11-19', 300, 'Apply planes of motion, axes, levers, force, torque, joint actions, posture, and movement observation to exercise coaching.', ['biomechanics', 'planes of motion', 'joint action', 'force']],
  ['cpt-4', 'MODULE 4 · ENERGY SYSTEMS & METABOLISM', '2026-11-20', 300, 'Compare ATP-PC, glycolytic, and oxidative energy systems; connect intensity and duration to fuel use, recovery, and adaptation.', ['ATP', 'energy systems', 'metabolism', 'recovery']],
  ['cpt-5', 'MODULE 5 · ASSESSMENTS & PROGRAM DESIGN', '2026-11-24', 450, 'Screen safely, establish baselines, select relevant assessments, interpret results, write SMART outcomes, and translate findings into a program.', ['PAR-Q', 'assessment', 'SMART goals', 'program design']],
  ['cpt-6', 'MODULE 6 · FLEXIBILITY & CARDIOVASCULAR TRAINING', '2026-11-27', 300, 'Choose safe flexibility methods and cardio variables using frequency, intensity, time, type, progression, and recovery.', ['flexibility', 'cardiorespiratory fitness', 'FITT', 'progression']],
  ['cpt-7', 'MODULE 7 · RESISTANCE TRAINING & EXERCISE TECHNIQUES', '2026-11-30', 300, 'Coach the major movement patterns, select regressions and progressions, control technique, and program resistance variables for the client goal.', ['resistance training', 'technique', 'progression', 'movement patterns']],
  ['cpt-8', 'MODULE 8 · PURPOSE-DRIVEN TRAINING MODEL', '2026-12-05', 600, 'Use the ISSA Purpose-Driven Training Model to connect interview findings, movement observation, exercise selection, variables, and progression.', ['PDTM', 'movement observation', 'training variables', 'progression']],
  ['cpt-9', 'MODULE 9 · NUTRITION & SPECIAL POPULATIONS', '2026-12-09', 450, 'Stay within scope while explaining nutrition foundations, supplements, chronic conditions, contraindications, and appropriate referral.', ['nutrition scope', 'supplements', 'chronic conditions', 'referral']],
  ['cpt-10', 'MODULE 10 · BUSINESS, MARKETING & SAFETY', '2026-12-12', 450, 'Apply lifespan modifications, ethical business practices, marketing basics, risk management, emergency response, and documentation.', ['lifespan', 'business', 'ethics', 'emergency response']],
  ['cpt-final', 'ISSA CPT COURSE EXAM · 95% PRACTICE GATE', '2026-12-14', 240, 'Complete cumulative open-note preparation. Locate references quickly, explain why every answer is right, and correct every weak domain before the course exam.', ['cumulative review', 'open-note strategy', 'weak-domain repair']],
];

const nutritionModules = [
  ['nutrition-1', 'MODULE 1 · FOUNDATIONS OF NUTRITION', '2026-11-16', 150, 'Explain the role of nutrition coaching, energy, nutrients, food quality, scope, and evidence-based communication.', ['scope', 'nutrients', 'energy', 'evidence']],
  ['nutrition-2', 'MODULE 2 · THE HUMAN BODY & DIGESTION', '2026-11-17', 150, 'Follow food through digestion, absorption, transport, storage, and elimination; connect organ function to coaching observations.', ['digestion', 'absorption', 'GI system', 'transport']],
  ['nutrition-3', 'MODULE 3 · METABOLISM & ENERGY BALANCE', '2026-11-18', 150, 'Relate resting metabolism, thermic effect, activity, intake, expenditure, and adaptation to realistic client outcomes.', ['BMR', 'TDEE', 'energy balance', 'adaptation']],
  ['nutrition-4', 'MODULE 4 · MACRONUTRIENTS', '2026-11-20', 300, 'Compare carbohydrates, proteins, and fats by function, digestion, food sources, quality, and their role in performance and body composition.', ['carbohydrate', 'protein', 'fat', 'fiber']],
  ['nutrition-5', 'MODULE 5 · MICRONUTRIENTS', '2026-11-23', 300, 'Distinguish fat- and water-soluble vitamins, major and trace minerals, deficiency risk, food sources, and safe coaching boundaries.', ['vitamins', 'minerals', 'deficiency', 'food sources']],
  ['nutrition-6', 'MODULE 6 · HYDRATION & HUMAN COACHING', '2026-11-27', 300, 'Assess hydration habits, recognize risk signs, communicate without judgment, and support sustainable client behavior.', ['hydration', 'electrolytes', 'communication', 'habits']],
  ['nutrition-7', 'MODULE 7 · COACHING, ASSESSMENT & BUSINESS', '2026-11-28', 150, 'Conduct intake, set measurable outcomes, document progress, coach adherence, and operate within professional and business boundaries.', ['assessment', 'goals', 'adherence', 'documentation']],
  ['nutrition-8', 'MODULE 8 · POLICY, GUIDELINES & LEGAL COMPLIANCE', '2026-12-01', 300, 'Use dietary guidance responsibly, distinguish education from medical nutrition therapy, document consent, and refer when required.', ['dietary guidelines', 'legal scope', 'consent', 'referral']],
  ['nutrition-9', 'MODULE 9 · SUPPLEMENTS & DIET TRENDS', '2026-12-03', 300, 'Evaluate supplement claims and popular diets for evidence, safety, adherence, contraindications, and client fit.', ['supplements', 'diet trends', 'evidence', 'contraindications']],
  ['nutrition-10', 'MODULE 10 · SPECIAL POPULATIONS & ADVANCED APPLICATIONS', '2026-12-04', 150, 'Modify education for age, activity, pregnancy, chronic conditions, and performance while maintaining referral boundaries.', ['special populations', 'performance nutrition', 'modification', 'referral']],
  ['nutrition-final', 'NUTRITION COACH FINAL · 95% PRACTICE GATE', '2026-12-07', 240, 'Complete cumulative practice, repair weak domains, and explain each decision in client-centered language before the final.', ['cumulative review', 'case application', 'weak-domain repair']],
];

export const THICC_SCHOOL_COURSES = [
  {
    id: 'cpt', short: 'CPT', title: 'CERTIFIED PERSONAL TRAINER · 11TH EDITION', deadline: '2027-01-15', portalCourseId: '7193',
    portalStatus: 'IN PROGRESS', sections: cptModules.map((row) => section(...row)),
  },
  {
    id: 'nutrition', short: 'NUTRITION', title: 'NUTRITION COACH', deadline: '2027-02-18', portalCourseId: '6714',
    portalStatus: 'IN PROGRESS', sections: nutritionModules.map((row) => section(...row)),
  },
  {
    id: 'cpr', short: 'CPR/AED', title: 'CPR/AED CERTIFICATION PROGRAM', deadline: '2026-11-30', portalCourseId: '7189',
    portalStatus: 'ENROLLED', sections: [
      section('cpr-guided-1', 'GUIDED STUDY 1–3', '2026-11-12', 180, 'Master scene safety, emergency activation, consent, assessment, compressions, breaths, and adult AED use.', ['scene safety', 'CAB', 'compressions', 'AED']),
      section('cpr-guided-2', 'GUIDED STUDY 4–6', '2026-11-12', 150, 'Differentiate child and infant CPR, choking response, team roles, and special AED considerations.', ['child CPR', 'infant CPR', 'choking', 'team response']),
      section('cpr-final', 'FINAL REVIEW + EXAM', '2026-11-13', 180, 'Demonstrate correct sequence, ratios, depth, rate, recoil, interruptions, emergency activation, and safe AED operation.', ['sequence', 'rate and depth', 'AED safety', 'choking response']),
    ],
  },
  {
    id: 'bodybuilding', short: 'BODYBUILDING', title: 'BODYBUILDING SPECIALIST', deadline: '2027-02-18', portalCourseId: '6735', portalStatus: 'ONBOARDING LOCKED',
    sections: [
      section('bodybuilding-onboarding', 'COMPLETE ONBOARDING + UNLOCK COURSE', '2026-11-13', 150, 'Complete every onboarding item so the verified chapter titles and assessments become available.', ['onboarding', 'course unlock'], 'ISSA PORTAL'),
      ...numberedSections({ prefix: 'bodybuilding-chapter', count: 16, startDate: '2026-12-15', title: 'EDITABLE CHAPTER', guide: (number) => `Working chapter ${number}. Replace this label with the exact portal title after the course unlocks; capture objectives, hypertrophy applications, and assessment requirements.`, focus: ['hypertrophy', 'program design', 'recovery'] }),
      section('bodybuilding-final', '110-QUESTION FINAL · 95% PRACTICE GATE', '2027-01-03', 240, 'Complete a cumulative bodybuilding practice cycle, repair every weak domain, then take the verified course final.', ['hypertrophy', 'periodization', 'nutrition', 'recovery'], 'ISSA PORTAL'),
    ],
  },
  {
    id: 'strength', short: 'STRENGTH', title: 'STRENGTH & CONDITIONING', deadline: '2027-02-18', portalCourseId: '6718', portalStatus: 'ONBOARDING LOCKED',
    sections: [
      section('strength-onboarding', 'COMPLETE ONBOARDING + UNLOCK COURSE', '2026-11-14', 180, 'Complete all onboarding requirements so the verified curriculum and assessments become available.', ['onboarding', 'course unlock'], 'ISSA PORTAL'),
      ...numberedSections({ prefix: 'strength-block', count: 16, startDate: '2026-12-15', title: 'EDITABLE COURSE BLOCK', guide: (number) => `Working strength and conditioning block ${number}. Replace with the exact portal title after unlock; capture objectives, coaching applications, and exam domains.`, focus: ['strength', 'power', 'conditioning', 'program design'] }),
      section('strength-final', 'FINAL EXAM · 95% PRACTICE GATE', '2027-01-09', 240, 'Complete cumulative strength and conditioning practice and close every weak domain before the verified final.', ['assessment', 'strength', 'power', 'conditioning'], 'EDITABLE COURSE MAP'),
    ],
  },
  {
    id: 'exercise-effect', short: 'EXERCISE EFFECT', title: 'THE EXERCISE EFFECT', deadline: '2027-01-29', portalCourseId: '7159', portalStatus: 'ACCESS BLOCKED · 403',
    sections: [
      section('effect-access', 'ISSA SUPPORT · RESTORE COURSE ACCESS', '2026-11-12', 30, 'Access currently returns Not authorized. Contact ISSA support and retain the case number before coursework can be verified.', ['support case', 'access restoration'], 'PORTAL BLOCKER'),
      ...numberedSections({ prefix: 'effect-block', count: 6, startDate: '2027-01-04', title: 'EDITABLE COURSE BLOCK', guide: (number) => `Working Exercise Effect block ${number}. Replace with the official portal title and objectives immediately after access is restored.`, focus: ['exercise effects', 'application'], source: 'ACCESS PENDING' }),
      section('effect-final', 'FINAL EXAM · 95% PRACTICE GATE', '2027-01-22', 180, 'Complete verified course review and achieve practice mastery before the final.', ['cumulative review'], 'ACCESS PENDING'),
    ],
  },
  {
    id: 'nccpt', short: 'NCCPT', title: 'NCCPT ACCREDITED CPT EXAM', deadline: '2027-01-29', portalCourseId: '', portalStatus: 'EXAM ELIGIBILITY IN PROGRESS',
    sections: [
      section('nccpt-domain-1', 'DOMAIN · SCIENTIFIC FOUNDATIONS', '2027-01-10', 180, 'Review anatomy, physiology, biomechanics, energy systems, and exercise science without notes.', ['anatomy', 'physiology', 'biomechanics', 'energy systems'], 'ORIGINAL EXAM PREP'),
      section('nccpt-domain-2', 'DOMAIN · CLIENT ASSESSMENT', '2027-01-12', 180, 'Practice screening, risk recognition, baseline assessment, goal setting, and referral decisions.', ['screening', 'assessment', 'risk', 'referral'], 'ORIGINAL EXAM PREP'),
      section('nccpt-domain-3', 'DOMAIN · PROGRAM DESIGN', '2027-01-14', 180, 'Build safe, progressive programs from client data using resistance, cardio, flexibility, recovery, and progression variables.', ['program design', 'progression', 'FITT', 'recovery'], 'ORIGINAL EXAM PREP'),
      section('nccpt-domain-4', 'DOMAIN · EXERCISE INSTRUCTION', '2027-01-16', 180, 'Coach setup, execution, breathing, spotting, regressions, progressions, and error correction.', ['technique', 'spotting', 'regression', 'progression'], 'ORIGINAL EXAM PREP'),
      section('nccpt-domain-5', 'DOMAIN · SAFETY, ETHICS & PROFESSIONAL PRACTICE', '2027-01-19', 180, 'Apply emergency response, scope, documentation, confidentiality, professional conduct, and business safety.', ['ethics', 'scope', 'emergency', 'documentation'], 'ORIGINAL EXAM PREP'),
      section('nccpt-practice', 'CLOSED-BOOK 120-MINUTE PRACTICE · 95% GATE', '2027-01-21', 240, 'Simulate closed-book conditions. Review every miss, then repeat with a reshuffled form until 95% or higher.', ['timed exam', 'weak-domain repair', 'closed-book strategy'], 'ORIGINAL EXAM PREP'),
      section('nccpt-exam', 'TARGET PROCTORED EXAM DAY', '2027-01-23', 180, 'Target only until booked. The official exam is professionally proctored through Prometric and requires a separate appointment.', ['Prometric', 'exam-day readiness'], 'ISSA PORTAL'),
    ],
  },
];

export const THICC_SCHOOL_QUESTION_BANK = [
  { id: 'cpt-001', courses: ['cpt', 'nccpt'], topic: 'scope of practice', prompt: 'A client reports unexplained chest pressure during exercise. What is the trainer’s best immediate action?', options: ['Lower the resistance and continue', 'Stop exercise and activate the appropriate emergency response', 'Recommend a supplement', 'Diagnose the likely cause'], answer: 1, rationale: 'A trainer stops the session and follows the emergency plan; diagnosis is outside scope.' },
  { id: 'cpt-002', courses: ['cpt', 'nccpt'], topic: 'behavior change', prompt: 'Which goal is the strongest example of a process goal?', options: ['Lose 20 pounds', 'Complete three planned walks each week', 'Reach 15% body fat', 'Fit into a smaller shirt'], answer: 1, rationale: 'A process goal defines a repeatable behavior the client can directly perform.' },
  { id: 'cpt-003', courses: ['cpt', 'nccpt'], topic: 'anatomy', prompt: 'During the upward phase of a biceps curl, the elbow primarily performs which joint action?', options: ['Extension', 'Abduction', 'Flexion', 'Internal rotation'], answer: 2, rationale: 'The elbow moves into flexion as the forearm approaches the upper arm.' },
  { id: 'cpt-004', courses: ['cpt', 'nccpt'], topic: 'planes of motion', prompt: 'A conventional forward lunge occurs primarily in which plane?', options: ['Sagittal', 'Frontal', 'Transverse', 'Oblique'], answer: 0, rationale: 'Forward and backward movement with flexion and extension is primarily sagittal.' },
  { id: 'cpt-005', courses: ['cpt', 'nccpt'], topic: 'energy systems', prompt: 'A maximal effort lasting about eight seconds relies most heavily on which energy system?', options: ['Oxidative', 'ATP-PC', 'Aerobic glycolysis', 'Fat oxidation'], answer: 1, rationale: 'The phosphagen system supplies rapid energy for very short maximal efforts.' },
  { id: 'cpt-006', courses: ['cpt', 'nccpt'], topic: 'assessment', prompt: 'What is the primary purpose of a preparticipation health screen?', options: ['Diagnose disease', 'Identify risk and need for medical clearance', 'Determine the client’s personality type', 'Select a supplement plan'], answer: 1, rationale: 'Screening identifies risk, contraindications, and when referral or clearance is appropriate.' },
  { id: 'cpt-007', courses: ['cpt', 'nccpt'], topic: 'program design', prompt: 'A novice client demonstrates poor control during a loaded squat. What is the best programming response?', options: ['Add weight to improve focus', 'Regress the movement and reinforce technique', 'Increase speed', 'Remove all lower-body training'], answer: 1, rationale: 'Regressing complexity or load allows safe skill acquisition and progressive exposure.' },
  { id: 'cpt-008', courses: ['cpt', 'nccpt'], topic: 'flexibility', prompt: 'Which flexibility method is generally most appropriate during a cool-down?', options: ['Ballistic stretching to discomfort', 'Controlled static stretching', 'Maximal plyometrics', 'Heavy eccentric lifting'], answer: 1, rationale: 'Controlled static stretching is commonly appropriate when tissues are warm and intensity is declining.' },
  { id: 'cpt-009', courses: ['cpt', 'nccpt'], topic: 'cardiorespiratory fitness', prompt: 'In the FITT principle, the second T represents what?', options: ['Tempo', 'Training age', 'Type', 'Threshold'], answer: 2, rationale: 'FITT stands for frequency, intensity, time, and type.' },
  { id: 'cpt-010', courses: ['cpt', 'nccpt'], topic: 'resistance training', prompt: 'Which change most directly increases resistance-training volume?', options: ['Fewer total repetitions', 'More sets or repetitions at a given load', 'Longer sleep duration', 'Lower exercise frequency'], answer: 1, rationale: 'Volume rises when total work, commonly sets times repetitions times load, increases.' },
  { id: 'cpt-011', courses: ['cpt', 'nccpt'], topic: 'technique', prompt: 'What is the safest first response when a client cannot maintain a neutral spine during a deadlift pattern?', options: ['Increase range of motion', 'Reduce load or range and re-coach the hinge', 'Add instability', 'Move faster'], answer: 1, rationale: 'Reducing demand and restoring the movement pattern is safer than adding load, speed, or complexity.' },
  { id: 'cpt-012', courses: ['cpt', 'nccpt'], topic: 'nutrition scope', prompt: 'Which action is within a personal trainer’s general nutrition scope?', options: ['Prescribing a therapeutic meal plan', 'Diagnosing a nutrient deficiency', 'Providing general healthy-eating education', 'Treating diabetes with diet'], answer: 2, rationale: 'General education is appropriate; diagnosis and medical nutrition therapy require qualified healthcare professionals.' },
  { id: 'cpt-013', courses: ['cpt', 'nccpt'], topic: 'special populations', prompt: 'A client presents a condition outside the trainer’s competence. What is the best action?', options: ['Experiment cautiously', 'Refer to an appropriate qualified professional', 'Ignore the condition', 'Promise a cure'], answer: 1, rationale: 'Professional scope requires referral when needs exceed competence or credentials.' },
  { id: 'cpt-014', courses: ['cpt', 'nccpt'], topic: 'ethics', prompt: 'Which practice best protects client confidentiality?', options: ['Discussing cases in public without names', 'Sharing records only with authorization and secure handling', 'Posting progress photos automatically', 'Leaving files open for convenience'], answer: 1, rationale: 'Client information should be secured and shared only with proper authorization.' },
  { id: 'cpt-015', courses: ['cpt', 'nccpt'], topic: 'emergency response', prompt: 'An AED advises no shock. What should the responder generally do next?', options: ['Remove the pads', 'Resume CPR and follow device prompts', 'Wait five minutes', 'Turn off the AED'], answer: 1, rationale: 'The responder resumes CPR and continues following the AED’s prompts.' },
  { id: 'nutrition-001', courses: ['nutrition'], topic: 'digestion', prompt: 'Where does most nutrient absorption occur?', options: ['Mouth', 'Stomach', 'Small intestine', 'Large intestine'], answer: 2, rationale: 'The small intestine is the primary site for nutrient digestion and absorption.' },
  { id: 'nutrition-002', courses: ['nutrition'], topic: 'energy balance', prompt: 'A sustained positive energy balance most directly supports which outcome?', options: ['Body-mass gain', 'Immediate dehydration', 'Loss of all lean tissue', 'Lower food intake'], answer: 0, rationale: 'Energy intake exceeding expenditure over time supports body-mass gain.' },
  { id: 'nutrition-003', courses: ['nutrition'], topic: 'protein', prompt: 'Which nutrient provides amino acids used to build and repair tissue?', options: ['Protein', 'Water', 'Fiber', 'Alcohol'], answer: 0, rationale: 'Dietary protein supplies amino acids for tissue synthesis and repair.' },
  { id: 'nutrition-004', courses: ['nutrition'], topic: 'fat', prompt: 'Which is a key function of dietary fat?', options: ['Eliminating the need for protein', 'Supporting cell membranes and fat-soluble vitamin absorption', 'Preventing all inflammation', 'Replacing water'], answer: 1, rationale: 'Fat supports cell structures, hormones, energy storage, and absorption of vitamins A, D, E, and K.' },
  { id: 'nutrition-005', courses: ['nutrition'], topic: 'micronutrients', prompt: 'Which vitamins are fat-soluble?', options: ['B and C', 'A, D, E, and K', 'C and K only', 'All vitamins'], answer: 1, rationale: 'Vitamins A, D, E, and K are fat-soluble.' },
  { id: 'nutrition-006', courses: ['nutrition'], topic: 'hydration', prompt: 'Which observation most strongly supports pausing exercise and assessing hydration or heat risk?', options: ['Mild hunger', 'Confusion and loss of coordination', 'A preference for cold water', 'Normal sweating'], answer: 1, rationale: 'Confusion and coordination changes can signal a serious heat-related emergency.' },
  { id: 'nutrition-007', courses: ['nutrition'], topic: 'coaching', prompt: 'Which question best supports client-centered coaching?', options: ['Why can’t you follow the plan?', 'What change feels realistic this week?', 'Don’t you want results?', 'Should I decide for you?'], answer: 1, rationale: 'Open, nonjudgmental questions support autonomy and realistic behavior selection.' },
  { id: 'nutrition-008', courses: ['nutrition'], topic: 'legal scope', prompt: 'A client requests treatment for a diagnosed kidney condition through nutrition. What should the coach do?', options: ['Create a therapeutic diet', 'Refer to an appropriately credentialed healthcare professional', 'Recommend a detox', 'Ignore the diagnosis'], answer: 1, rationale: 'Medical nutrition therapy for disease requires an appropriately qualified professional.' },
  { id: 'nutrition-009', courses: ['nutrition'], topic: 'supplements', prompt: 'What is the strongest first step when evaluating a supplement claim?', options: ['Trust the label', 'Review evidence, dose, safety, interactions, and third-party testing', 'Assume natural means safe', 'Use the highest dose'], answer: 1, rationale: 'Claims require evidence and a safety review, including interactions and quality testing.' },
  { id: 'nutrition-010', courses: ['nutrition'], topic: 'special populations', prompt: 'Why should nutrition coaching for pregnancy be coordinated with healthcare providers?', options: ['Pregnancy never changes nutrition needs', 'Individual risk and medical needs may require clinical oversight', 'Only supplements matter', 'Exercise is always prohibited'], answer: 1, rationale: 'Pregnancy changes needs and risk; clinical coordination protects the client.' },
  { id: 'cpr-001', courses: ['cpr'], topic: 'compressions', prompt: 'For high-quality adult CPR, what should happen after each compression?', options: ['Pause for ten seconds', 'Allow complete chest recoil', 'Remove both hands', 'Give a breath'], answer: 1, rationale: 'Complete recoil supports venous return and effective subsequent compressions.' },
  { id: 'cpr-002', courses: ['cpr'], topic: 'AED safety', prompt: 'What must the responder verify before an AED shock is delivered?', options: ['Everyone is clear of the person', 'The pads are removed', 'CPR has stopped permanently', 'The battery is disconnected'], answer: 0, rationale: 'No one should be touching the person during analysis or shock delivery.' },
  { id: 'cpr-003', courses: ['cpr'], topic: 'choking response', prompt: 'A responsive adult cannot speak, cough, or breathe. What does this indicate?', options: ['Mild obstruction', 'Severe airway obstruction requiring immediate action', 'Normal fatigue', 'A reason to offer water'], answer: 1, rationale: 'Inability to speak, cough, or breathe indicates severe choking.' },
  { id: 'bodybuilding-001', courses: ['bodybuilding'], topic: 'hypertrophy', prompt: 'Which factor is a central driver of muscular hypertrophy when training is recoverable?', options: ['Progressive mechanical tension', 'Avoiding all fatigue', 'Never changing load', 'Eliminating protein'], answer: 0, rationale: 'Progressive mechanical tension is a primary hypertrophy stimulus when paired with sufficient recovery.' },
  { id: 'bodybuilding-002', courses: ['bodybuilding'], topic: 'recovery', prompt: 'Performance falls for several sessions while soreness and fatigue remain elevated. What is the best first adjustment?', options: ['Add more failure sets', 'Reduce training stress and restore recovery', 'Remove sleep', 'Double frequency immediately'], answer: 1, rationale: 'Persistent fatigue suggests training stress exceeds recovery capacity.' },
  { id: 'bodybuilding-003', courses: ['bodybuilding'], topic: 'program design', prompt: 'What does training volume most commonly describe?', options: ['Only exercise order', 'The amount of work performed', 'Only rest time', 'Only exercise selection'], answer: 1, rationale: 'Volume describes total work, commonly estimated from sets, repetitions, and load.' },
  { id: 'strength-001', courses: ['strength'], topic: 'power', prompt: 'Power is best described as the ability to do what?', options: ['Produce force quickly', 'Hold a stretch indefinitely', 'Avoid all acceleration', 'Reduce coordination'], answer: 0, rationale: 'Power reflects force produced over time, often expressed as force times velocity.' },
  { id: 'strength-002', courses: ['strength'], topic: 'conditioning', prompt: 'Which principle requires training demands to resemble the target performance demand?', options: ['Specificity', 'Randomness', 'Detraining', 'Reversibility only'], answer: 0, rationale: 'The specificity principle aligns training adaptations with the imposed demand.' },
  { id: 'strength-003', courses: ['strength'], topic: 'periodization', prompt: 'Why is planned variation used in a training program?', options: ['To avoid all measurement', 'To manage fatigue and target adaptations over time', 'To make every session maximal', 'To remove progression'], answer: 1, rationale: 'Planned variation balances stimulus, recovery, and targeted adaptation.' },
];

export const THICC_SCHOOL_RESERVED_DATES = [...RESERVED_STUDY_DATES];
export const THICC_SCHOOL_MASTERY_SCORE = 95;
export const THICC_SCHOOL_VERSION = 'thicc-school-2026-11-v1';
