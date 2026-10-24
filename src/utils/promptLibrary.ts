export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Concepts & Theory' | 'Problem Solving' | 'Practice & Quizzes' | 'Practicals & Lab Reports' | 'Planning & Summaries';
  description: string;
  template: (variables: { course?: string; topic?: string; level?: string; notes?: string }) => string;
}

export const AI_PROMPT_LIBRARY: PromptTemplate[] = [
  {
    id: 'p-explain-plain',
    title: '1. Explaining a Difficult Topic in Plain Language',
    category: 'Concepts & Theory',
    description: 'Breaks down complex theoretical concepts into accessible, intuitive language with analogies and key definitions.',
    template: ({ course, topic, level, notes }) =>
`You are an expert university professor and patient academic tutor.
Course: ${course || '[Insert Course Code, e.g. EEE 311 / MTH 301]'}
Topic: ${topic || '[Insert Topic, e.g. Thevenin’s Theorem / Poynting Vector]'}
Academic Level: ${level || 'Undergraduate Year 3 (300L)'}

Task:
Please explain this topic from first principles using clear, plain English suitable for an undergraduate student:
1. Core Intuition: What problem does this concept solve in real-world engineering or science?
2. Step-by-Step Breakdown: Explain the fundamental principles and laws governing it.
3. Common Misconceptions: What do students typically confuse about this?
4. Summary Checklist: 3 bullet points summarizing what must be remembered for an examination.

${notes ? `Student's context notes:\n${notes}\n` : ''}
Do not use unnecessary jargon without defining it immediately.`,
  },
  {
    id: 'p-math-breakdown',
    title: '2. Breaking Down a Mathematical Problem into Steps',
    category: 'Problem Solving',
    description: 'Walks through complex mathematical, physical, or engineering derivation with explicit algebra steps and rationale.',
    template: ({ course, topic, notes }) =>
`You are a senior mathematics and engineering lecturer.
Course: ${course || '[Insert Course Code, e.g. MTH 301 Mathematical Methods]'}
Topic: ${topic || '[Insert Problem Type, e.g. Fourier Series / Second-Order Differential Equations]'}

Problem to solve:
${notes || '[Paste your specific equation or assignment problem statement here]'}

Requirements:
1. Identify the mathematical category and boundary/initial conditions.
2. State the primary formula or theorem to apply and explain every variable.
3. Show every algebraic and integration step without skipping intermediate arithmetic.
4. Verify the dimensions/units of the final result.
5. Highlight the exact step where students most frequently make sign errors or integration mistakes.`,
  },
  {
    id: 'p-worked-example',
    title: '3. Teaching a Concept Using a Worked Example',
    category: 'Problem Solving',
    description: 'Provides a realistic examination-style problem with comprehensive line-by-line solution and commentary.',
    template: ({ course, topic, level }) =>
`You are an academic coach preparing university students for departmental examinations.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}
Academic Level: ${level || '300L'}

Please construct a high-yield, realistic examination-standard problem on this topic:
1. State the problem clearly with reasonable numerical parameters.
2. Provide a "Strategy Guide": How should a student think about tackling this before writing equations?
3. Provide the full solution step-by-step with intermediate calculations clearly displayed.
4. Conclude with a "Pro Tip" for solving similar problems faster during timed university exams.`,
  },
  {
    id: 'p-practice-questions',
    title: '4. Practice Questions with Answer Key at the End',
    category: 'Practice & Quizzes',
    description: 'Generates 10 exam-standard practice questions (structured & multiple-choice) with solutions hidden at the bottom for active recall.',
    template: ({ course, topic, notes }) =>
`You are an examination question compiler for tertiary university assessments.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}

${notes ? `Lecture Scope / Syllabus Notes:\n${notes}\n` : ''}

Task:
Generate 10 rigorous, high-yield practice questions:
- Questions 1 to 5: Multiple-choice questions with 4 options (A, B, C, D) testing conceptual understanding.
- Questions 6 to 8: Short-answer calculation or definition questions.
- Questions 9 to 10: Examination-style analytical problem.

CRITICAL FORMATTING RULE:
Present all 10 questions FIRST without revealing the solutions.
Follow with a distinct horizontal divider (--- ANSWER KEY & FULL EXPLANATIONS ---) and provide the correct answers, step-by-step mathematical working, and why the distractors are wrong.`,
  },
  {
    id: 'p-mark-answers',
    title: '5. Marking the Student’s Attempted Answers',
    category: 'Practice & Quizzes',
    description: 'Evaluates your handwritten or typed solution, assigns realistic partial credit, and provides actionable correction.',
    template: ({ course, topic, notes }) =>
`You are a strict but constructive university course examiner.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}

Student’s Attempted Solution:
${notes || '[Paste your attempted answer, formulas used, and final result here]'}

Please evaluate my work:
1. Accuracy: Did I arrive at the correct final numerical answer / conclusion?
2. Method Evaluation: Is the method mathematically valid? Where was partial credit earned?
3. Error Analysis: Pinpoint the exact line or assumption where the mistake occurred (e.g., sign error, incorrect unit conversion, omitted boundary condition).
4. Model Solution: Show the clean, concise correct working to earn full marks.`,
  },
  {
    id: 'p-flashcards',
    title: '6. Producing Flashcards from Supplied Notes',
    category: 'Planning & Summaries',
    description: 'Converts raw lecture slides or textbook excerpts into high-retention front/back flashcards for spaced repetition.',
    template: ({ course, topic, notes }) =>
`You are a cognitive learning specialist optimizing study materials for spaced repetition.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}

Lecture Notes:
${notes || '[Paste your raw lecture notes, bullet points, or slides here]'}

Task:
Transform these notes into 12 crisp, atomic flashcards.
Format each card as:
Card [Number]:
- Front (Prompt/Question/Formula to recall):
- Back (Concise, definitive answer, units, or key condition):

Ensure cards test understanding and retrieval rather than simple passive recognition.`,
  },
  {
    id: 'p-summarize-notes',
    title: '7. Summarizing Lecture Notes Without Changing Meaning',
    category: 'Planning & Summaries',
    description: 'Condenses bulky lecture notes into a high-density, structured summary preserving all technical definitions and formulas.',
    template: ({ course, topic, notes }) =>
`You are an academic summarization engine for university students.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}

Raw Lecture Material:
${notes || '[Paste raw lecture transcripts or reading material here]'}

Task:
Produce a dense, high-retention study sheet:
1. Key Definitions & Laws: Verbatim core definitions and standard nomenclature.
2. Governing Equations: Formulate all mathematical relationships, define each parameter and standard SI units.
3. Comparison Table: If multiple methods, materials, or components are discussed, create a clean comparison table.
4. Core Takeaways: 5 non-negotiable points essential for tests and examinations.
Maintain 100% scientific fidelity without altering the meaning.`,
  },
  {
    id: 'p-practical-theory',
    title: '8. Explaining a Practical’s Theory and Procedure',
    category: 'Practicals & Lab Reports',
    description: 'Explains the scientific theory, apparatus setup, and procedural precautions of a university laboratory experiment.',
    template: ({ course, topic, notes }) =>
`You are a university laboratory instructor in engineering and physical sciences.
Course: ${course || '[Insert Course, e.g. PHY 107 / EEE 315]'}
Experiment: ${topic || '[Insert Practical Title, e.g. Verification of Ohm’s Law / RC Circuit Transient Response]'}

${notes ? `Apparatus / Manual Details:\n${notes}\n` : ''}

Task:
Provide a comprehensive pre-laboratory briefing:
1. Scientific Aim & Principle: What physical law or phenomenon is being tested?
2. Circuit / Apparatus Mechanics: How do the apparatus components interact? (Explain function of voltmeter, ammeter, rheostat, power source, etc.)
3. Procedural Walkthrough: Recommended step-by-step execution to obtain reliable data.
4. Safety & Precautions: 4 essential experimental precautions to minimize systematic and random errors (e.g. key switch open to prevent heating, parallax error avoidance, zero check).

ACADEMIC INTEGRITY DIRECTIVE: Do NOT invent, assume, or fabricate any readings or numerical measurements. Focus purely on explaining the scientific methodology.`,
  },
  {
    id: 'p-check-calculations',
    title: '9. Checking Calculations from Supplied Measurements',
    category: 'Practicals & Lab Reports',
    description: 'Verifies formulas, slopes, and percentage errors using your own real recorded experimental data.',
    template: ({ course, topic, notes }) =>
`You are a laboratory data analyst and scientific verifier.
Course: ${course || '[Insert Course]'}
Experiment: ${topic || '[Insert Experiment Title]'}

Student’s Actual Recorded Measurements:
${notes || '[Paste your recorded readings table here, e.g. Voltage (V), Current (I), Resistance (Ω), Time (s)]'}

Task:
1. Verify whether the mathematical substitutions match the recorded data.
2. Recalculate mean values, slopes (Δy/Δx), and derived quantities using standard scientific rules.
3. Compute the percentage discrepancy or experimental error against theoretical expectations.
4. Identify any outlier data points that suggest instrument drift, poor electrical contact, or recording errors.

ACADEMIC INTEGRITY DIRECTIVE: Use ONLY the numbers provided above. Never invent or adjust experimental observations.`,
  },
  {
    id: 'p-report-grammar-structure',
    title: '10. Improving the Structure and Grammar of a Practical Report',
    category: 'Practicals & Lab Reports',
    description: 'Refines academic tone, passive voice, and technical discussion of your laboratory draft.',
    template: ({ course, topic, notes }) =>
`You are a technical editor for scientific and engineering laboratory reports.
Course: ${course || '[Insert Course]'}
Experiment: ${topic || '[Insert Experiment]'}

Draft Report Content:
${notes || '[Paste your draft discussion, procedure, or conclusion here]'}

Task:
Improve this report section according to formal academic engineering standards:
1. Voice & Tense: Convert active voice ("we connected the circuit") into formal scientific third-person passive past tense ("the circuit was connected").
2. Technical Precision: Replace casual words with standard engineering terminology.
3. Discussion Depth: Relate the experimental outcome directly to the theoretical model, discussing experimental limitations and sources of error realistically.
4. Proofread: Correct grammatical, syntax, and punctuation errors.

ACADEMIC INTEGRITY DIRECTIVE: Do NOT fabricate or alter any measurements or findings. Enhance only presentation, grammar, and scientific analysis.`,
  },
  {
    id: 'p-revision-timetable',
    title: '11. Making a Revision Timetable Using Available Time',
    category: 'Planning & Summaries',
    description: 'Creates a realistic, sustainable daily revision schedule factoring in lectures, test deadlines, and difficult topics.',
    template: ({ level, notes }) =>
`You are an academic productivity coach for university students in Nigeria.
Level: ${level || '300L'}

Current Academic Load & Deadlines:
${notes || '[List your courses, upcoming test dates, and hours you can study daily, e.g. 3 hours weekdays, 6 hours weekends]'}

Task:
Design a realistic 7-day revision schedule:
1. Prioritization: Sequence topics based on deadline urgency and conceptual difficulty (start hard topics when cognitive energy is highest).
2. Spaced Time Blocks: Use 45-minute focused study sprints with 10-minute active recall breaks.
3. Active Practice Allocation: Ensure at least 40% of time is reserved for solving past questions and working calculations, not just passive reading.
4. Burnout Buffer: Include realistic meals, transit buffer for campus walking, and sleep recovery.`,
  },
  {
    id: 'p-explain-incorrect-answer',
    title: '12. Explaining Why the Student’s Answer is Incorrect',
    category: 'Concepts & Theory',
    description: 'Diagnoses conceptual traps, false assumptions, and mathematical missteps without judgment.',
    template: ({ course, topic, notes }) =>
`You are a compassionate, deeply knowledgeable academic mentor.
Course: ${course || '[Insert Course]'}
Topic: ${topic || '[Insert Topic]'}

Problem Statement:
${notes ? notes.split('---')[0] || notes : '[Insert the question]'}

My Answer that was Marked Wrong:
${notes && notes.includes('---') ? notes.split('---')[1] : '[Insert your answer]'}

Task:
1. Explain the underlying flaw in logic or physics that led to this answer.
2. What makes this a common or tempting distractor for students?
3. Walk through the correct deductive reasoning step-by-step.
4. Give a memorable mental heuristic so I never fall into this trap in future exams.`,
  },
];
