export type AIResourceId =
  | 'explain-topics'
  | 'break-down-problems'
  | 'teach-worked-examples'
  | 'practice-questions'
  | 'generate-flashcards'
  | 'summarize-notes'
  | 'calculation-assistant'
  | 'report-writer';

export interface AIResourceDefinition {
  id: AIResourceId;
  title: string;
  shortDescription: string;
  category: 'Conceptual' | 'Problem Solving' | 'Exam Prep' | 'Reports & Writing';
  badge: string;
  submitButtonText: string;
  loadingMessage: string;
  buildPrompt: (params: any) => string;
}

export const AI_STUDY_RESOURCES: AIResourceDefinition[] = [
  // 1. Explain Difficult Topics
  {
    id: 'explain-topics',
    title: 'Explain Difficult Topics',
    shortDescription: 'Explain complex concepts in accessible language with analogies, real-world intuition, and progressive depth.',
    category: 'Conceptual',
    badge: 'Intuitive Theory',
    submitButtonText: 'Generate Explanation',
    loadingMessage: 'Analyzing concept from first principles and formulating intuitive explanation...',
    buildPrompt: ({ course, topic, style, difficulty = 'Intermediate', specificQuestions }) =>
`You are an expert university professor and patient academic tutor.
Course: ${course || 'General'}
Topic: ${topic}
Target Difficulty: ${difficulty}
${style ? `Preferred Explanation Style: ${style}` : ''}
${specificQuestions ? `Student's Specific Questions/Confusions:\n${specificQuestions}\n` : ''}

DIFFICULTY LEVEL DIRECTIVES:
${difficulty === 'Beginner' ? '- Beginner: Foundational explanations, simpler examples, slower pacing, explicit steps from absolute first principles.' : difficulty === 'Advanced' ? '- Advanced: Deep theoretical derivations, complex edge cases, rigorous terminology, fewer introductory explanations.' : '- Intermediate: Assume basic university familiarity, standard academic methods, moderate complexity.'}

Task:
Explain this topic thoroughly in accessible language:
1. Core Intuition: What fundamental problem does this concept solve in real-world science or engineering?
2. Progressive Explanation: Start with the foundational principles and build gradually to the advanced technical details.
3. Essential Definitions & Analogies: Define all technical terms clearly and provide an intuitive analogy.
4. Concrete Examples: Show how this concept behaves in practice with a clear illustrative scenario.
5. Common Misconceptions: What do students typically confuse about this?
6. Exam Checklist: Key points and relationships that must be understood for university assessments.

ACADEMIC DIRECTIVE: Never invent facts. Maintain scientific rigor and clarity without unnecessary jargon.`,
  },

  // 2. Break Down Problems Step by Step
  {
    id: 'break-down-problems',
    title: 'Break Down Problems Step by Step',
    shortDescription: 'Solve mathematical, physics, and engineering problems using explicit formulas, intermediate substitutions, and units.',
    category: 'Problem Solving',
    badge: 'Step-by-Step Solver',
    submitButtonText: 'Break Down Problem',
    loadingMessage: 'Identifying governing formulas, boundary conditions, and computing step-by-step algebra...',
    buildPrompt: ({ course, problemStatement, givenValues, targetUnknowns, difficulty = 'Intermediate' }) =>
`You are a senior engineering and mathematics university lecturer.
Course: ${course || 'General'}
Problem Statement:
${problemStatement}

Target Difficulty: ${difficulty}
${givenValues ? `Supplied Given Values & Constraints:\n${givenValues}\n` : ''}
${targetUnknowns ? `Target Unknown(s) to Determine:\n${targetUnknowns}\n` : ''}

DIFFICULTY LEVEL DIRECTIVES:
${difficulty === 'Beginner' ? '- Beginner: Show explicit elementary algebra, step-by-step arithmetic at every line, explicit parameter substitutions.' : difficulty === 'Advanced' ? '- Advanced: Honors/graduate level complexity, rigorous proofs/derivations, non-trivial boundary constraints, deep reasoning.' : '- Intermediate: Standard university examination complexity, complete intermediate working.'}

Task:
Solve this problem step by step with zero skipped steps:
1. Problem Classification & Assumptions: State the mathematical/physical domain, governing laws, and verify explicit assumptions. Distinguish supplied information from assumptions.
2. Governing Formulas: State the primary formulas and define all variables and standard SI units.
3. Value Substitution: Substitute numerical or algebraic values into the equations explicitly.
4. Step-by-Step Working: Show every intermediate algebraic transformation, calculus step, or arithmetic reduction clearly. Never silently skip intermediate algebra.
5. Final Answer & Verification: State the final answer clearly with appropriate precision and units. Check dimensions/units consistency and test boundary conditions to verify correctness.`,
  },

  // 3. Teach with Worked Examples
  {
    id: 'teach-worked-examples',
    title: 'Teach with Worked Examples',
    shortDescription: 'Demonstrate complete university-level worked examples with problem-solving strategies and reusable methods.',
    category: 'Problem Solving',
    badge: 'Worked Examples',
    submitButtonText: 'Generate Worked Example',
    loadingMessage: 'Synthesizing examination-standard problem, strategy guide, and complete solution...',
    buildPrompt: ({ course, concept, difficulty = 'Intermediate', focusArea }) =>
`You are an academic coach preparing university students for departmental examinations.
Course: ${course || 'General'}
Concept / Problem Type: ${concept}
Target Difficulty: ${difficulty}
${focusArea ? `Focus Area: ${focusArea}` : ''}

DIFFICULTY LEVEL DIRECTIVES:
${difficulty === 'Beginner' ? '- Beginner: Foundational introductory problem with clean, basic numerical values, slower pacing, and explicit foundational explanation.' : difficulty === 'Advanced' ? '- Advanced: Challenging multi-concept examination problem with deep mathematical derivations and edge cases.' : '- Intermediate: Realistic, exam-standard university problem with typical parameters and standard methods.'}

Task:
1. Concept Summary: Briefly summarize the underlying theory and the governing laws students need to know.
2. Examination-Standard Problem: Construct a realistic, exam-grade problem with clean, plausible numerical parameters.
3. Strategy Guide: Explain how a student should analyze this problem before writing any equation (what clues to look for).
4. Complete Line-by-Line Solution: Provide the full step-by-step solution, explaining the reasoning behind each step and showing all calculations.
5. Reusable General Method & Pro Tips: Summarize the repeatable recipe students can apply to similar exam questions, including common pitfalls to avoid.`,
  },

  // 4. Practice Questions with Answer Key
  {
    id: 'practice-questions',
    title: 'Practice Questions with Answer Key',
    shortDescription: 'Generate exam-standard practice questions with solutions placed strictly at the end for active recall.',
    category: 'Exam Prep',
    badge: 'Active Recall',
    submitButtonText: 'Generate Practice Questions',
    loadingMessage: 'Constructing university-level questions and detailed answer key...',
    buildPrompt: ({ course, topic, count = 5, difficulty = 'Intermediate', questionTypes = 'Mixed' }) =>
`You are a university examination compiler and assessment specialist.
Course: ${course || 'General'}
Topic / Scope: ${topic}
Number of Questions: ${count}
Target Difficulty: ${difficulty}
Question Types: ${questionTypes}

DIFFICULTY LEVEL DIRECTIVES:
${difficulty === 'Beginner' ? '- Beginner: Foundational practice questions testing basic definitions, core concepts, and simple direct application.' : difficulty === 'Advanced' ? '- Advanced: Challenging, multi-step honors exam questions requiring deep synthesis and complex problem solving.' : '- Intermediate: Standard university examination questions testing analytical reasoning and typical exam calculations.'}

Task:
Generate ${count} high-yield university-level practice questions designed for rigorous test preparation.

CRITICAL FORMATTING INSTRUCTION:
- Present ALL ${count} questions FIRST. Do NOT reveal answers, hints, or solutions underneath individual questions.
- After all questions are stated, place this exact divider line on its own line:
--- ANSWER KEY & FULL EXPLANATIONS ---
- Underneath the divider, provide the full answer key:
  * For multiple-choice questions: give the correct option letter, the rationale, and explain why distractors are incorrect.
  * For calculation/analytical questions: provide full step-by-step mathematical working, formulas, and final answers with units.`,
  },

  // 5. Generate Flashcards
  {
    id: 'generate-flashcards',
    title: 'Generate Flashcards',
    shortDescription: 'Turn lecture notes or syllabus topics into concise, high-retention question-and-answer flashcard sets.',
    category: 'Exam Prep',
    badge: 'Flashcard Builder',
    submitButtonText: 'Generate Flashcard Set',
    loadingMessage: 'Extracting atomic concepts and formulating active recall flashcard pairs...',
    buildPrompt: ({ course, topic, notes, count = 8 }) =>
`You are a cognitive learning and spaced repetition specialist.
Course: ${course || 'General'}
Topic: ${topic || 'Course Notes'}
${notes ? `Source Notes / Syllabus Content:\n${notes}\n` : ''}
Target Count: ${count} flashcards

Task:
Transform this material into ${count} atomic, high-retention flashcards for active recall.

FORMATTING REQUIREMENTS:
Format each card cleanly using this exact pattern:

Card 1:
Q: [Clear, specific question targeting one distinct definition, theorem, formula, or concept]
A: [Concise, definitive answer with essential formula, unit, or explanation]

Card 2:
Q: [Next question]
A: [Next answer]

Ensure questions prompt active memory retrieval rather than passive recognition. Cover both fundamental definitions and practical applications.`,
  },

  // 6. Summarize and Simplify Lecture Notes
  {
    id: 'summarize-notes',
    title: 'Summarize and Simplify Lecture Notes',
    shortDescription: 'Transform dense lecture notes into clean, structured summaries preserving key formulas, definitions, and relationships.',
    category: 'Conceptual',
    badge: 'Note Simplifier',
    submitButtonText: 'Summarize & Simplify',
    loadingMessage: 'Processing lecture materials, extracting formulas, and structuring plain-language summary...',
    buildPrompt: ({ course, topicTitle, notes, focus = 'Comprehensive Technical Summary' }) =>
`You are an academic summarization engine for university students.
Course: ${course || 'General'}
${topicTitle ? `Lecture Topic / Heading: ${topicTitle}` : ''}
Summary Focus: ${focus}

Supplied Lecture Notes / Source Material:
${notes}

Task:
Produce a well-structured, clear study summary:
1. Executive Overview: A plain-English explanation of the lecture's core ideas and significance.
2. Governing Equations & Formulas: A structured markdown table containing every formula, the meaning of each variable, and standard SI units.
3. Essential Definitions & Technical Terms: Exact definitions of all key terminology.
4. Conceptual Mechanisms & Relationships: Explain difficult ideas step-by-step with clear cause-and-effect relationships.
5. Key Takeaways: 5 non-negotiable points essential for tests and coursework.

ACADEMIC INTEGRITY DIRECTIVE: Never invent content that is absent from supplied notes without clearly labeling additional explanatory material as "[Supplementary Explanation]".`,
  },

  // 7. Calculation Assistant
  {
    id: 'calculation-assistant',
    title: 'Calculation Assistant',
    shortDescription: 'Dedicated calculation workflow showing given values, governing formulas, unit conversions, and reasonableness checks.',
    category: 'Problem Solving',
    badge: 'Numerical Engine',
    submitButtonText: 'Calculate Step by Step',
    loadingMessage: 'Performing dimensional conversions, numerical substitutions, and reasonableness validation...',
    buildPrompt: ({ course, calculationTask, givenValues, targetQuantity, difficulty = 'Intermediate' }) =>
`You are a dedicated scientific, numerical, and engineering calculation assistant.
Course: ${course || 'General'}
Calculation Task / Problem:
${calculationTask}

Given Values & Units:
${givenValues}

Required Unknown(s) to Calculate:
${targetQuantity}

Target Difficulty: ${difficulty}

DIFFICULTY LEVEL DIRECTIVES:
${difficulty === 'Beginner' ? '- Beginner: Show explicit elementary arithmetic steps, simple unit conversions, and step-by-step substitution.' : difficulty === 'Advanced' ? '- Advanced: Multi-variable engineering systems, complex unit transformations, coupled governing equations, and rigorous uncertainty checks.' : '- Intermediate: Standard engineering calculation complexity, multi-unit conversions, 8-part structured output.'}

Task:
Perform this calculation using this exact 8-part structure:
1. Given Values: List all supplied numerical parameters with their stated units.
2. Required Quantity: Explicitly state the target variable to be computed.
3. Governing Formula: State the primary physical/mathematical equations and define all symbols.
4. Unit Conversions: Perform and document any necessary unit conversions (e.g. mm to m, rpm to rad/s, mA to A).
5. Value Substitution: Show the formula with the numerical values substituted directly.
6. Step-by-Step Calculation: Show each intermediate arithmetic/algebraic step with rounding at the end.
7. Final Answer: Highlight the final computed value clearly with appropriate significant figures and standard SI units.
8. Reasonableness & Sanity Check: Explain why this magnitude is physically realistic (e.g. order of magnitude check, energy conservation check, or boundary limits).

ACADEMIC DIRECTIVE: If any required parameter is missing, state the assumption explicitly or ask for the missing parameter. Never fabricate measurements.`,
  },

  // 8. Practical and Project Report Writer
  {
    id: 'report-writer',
    title: 'Practical and Project Report Writer',
    shortDescription: 'Draft formal laboratory practical reports or academic project reports adhering to departmental formats.',
    category: 'Reports & Writing',
    badge: 'Report Writer',
    submitButtonText: 'Generate Report Draft',
    loadingMessage: 'Drafting structured academic report with integrity safeguards and proper formatting...',
    buildPrompt: ({
      reportType,
      course,
      title,
      aim,
      instructions,
      findings,
      lecturerFormat,
    }) =>
`You are an academic engineering and scientific technical writing assistant.
Report Type: ${reportType} (${reportType === 'Laboratory Practical Report' ? 'Laboratory Practical Report' : 'Academic Project Report'})
Course: ${course || 'General'}
Title: ${title}
Aim / Objectives:
${aim}

${instructions ? `Supplied Experiment Instructions / Project Brief:\n${instructions}\n` : ''}
${findings ? `Recorded Results, Measurements, Observations, or Findings:\n${findings}\n` : ''}
${lecturerFormat ? `Lecturer's Instructions / Required Format (Optional):\n${lecturerFormat}\n` : ''}

Task:
Draft a complete, formal ${reportType} adhering to university academic standards.

CRITICAL ACADEMIC INTEGRITY DIRECTIVES:
- NEVER invent laboratory measurements, observations, numerical experimental results, citations, or project findings.
- If specific data was not provided above, use clear placeholders such as "[Insert Recorded Value for Voltage V_1]" or "[Insert Measured Mass in kg]" and explain what needs to be filled in.
- Distinguish theoretical expectations from experimentally observed results.
- If incomplete data is provided, draft the sections that can be supported and note what remains to be verified.
- Write in formal third-person scientific passive voice where applicable.

STRUCTURAL GUIDELINES:
${
  lecturerFormat
    ? `- IMPORTANT: The lecturer's supplied format specified above takes primary precedence for the section structure and style.`
    : reportType === 'Laboratory Practical Report'
    ? `Organize into these standard laboratory sections:
1. Title & Metadata
2. Aim & Objectives
3. Apparatus & Materials
4. Theoretical Background & Governing Equations
5. Experimental Procedure / Methodology
6. Observations & Results (incorporate provided readings or clear bracketed placeholders)
7. Sample Calculations & Data Analysis
8. Discussion of Results & Scientific Interpretation
9. Sources of Experimental Error & Precautions
10. Conclusion
11. References (standard academic references based on theory)`
    : `Organize into these standard academic project report sections:
1. Project Title & Abstract / Executive Summary
2. Problem Statement & Project Objectives
3. Literature / Background Context
4. Technical Methodology & Implementation Approach
5. Project Deliverables, Findings, or Output
6. Discussion & Technical Evaluation
7. Challenges Encountered & Recommendations
8. Conclusion
9. References`
}

Conclude with a brief checklist for the student before final submission.`,
  },
];

export interface FlashcardItem {
  id: number | string;
  question: string;
  answer: string;
}

/**
 * Parses flashcard text into an array of question-answer pairs for the interactive card carousel.
 */
export function parseFlashcards(text: string): FlashcardItem[] {
  if (!text) return [];

  const cards: Array<{ id: number; question: string; answer: string }> = [];

  // Match patterns like:
  // Card 1: ... Q: ... A: ...
  // or Question 1: ... Answer 1: ...
  const cardBlockRegex = /(?:Card\s*\d+:?|Question\s*\d+:?|^)([\s\S]*?)(?=(?:Card\s*\d+:?|Question\s*\d+:?|$))/gi;
  let match: RegExpExecArray | null;

  while ((match = cardBlockRegex.exec(text)) !== null) {
    const block = match[1]?.trim();
    if (!block) continue;

    // Check for Q: and A:
    const qMatch = block.match(/(?:Q:|Question:|Front:)\s*([\s\S]*?)(?=(?:A:|Answer:|Back:|$))/i);
    const aMatch = block.match(/(?:A:|Answer:|Back:)\s*([\s\S]*)$/i);

    if (qMatch && aMatch) {
      const q = qMatch[1].trim();
      const a = aMatch[1].trim();
      if (q && a) {
        cards.push({
          id: cards.length + 1,
          question: q,
          answer: a,
        });
      }
    }
  }

  return cards;
}
