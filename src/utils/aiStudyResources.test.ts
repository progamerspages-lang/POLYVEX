import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_STUDY_RESOURCES,
  AIResourceId,
  parseFlashcards,
} from './aiStudyResources.ts';

test('AI Study Resources Hub Definition & Completeness', async (t) => {
  await t.test('has exactly eight resources defined', () => {
    assert.strictEqual(AI_STUDY_RESOURCES.length, 8);
    const expectedIds: AIResourceId[] = [
      'explain-topics',
      'break-down-problems',
      'teach-worked-examples',
      'practice-questions',
      'generate-flashcards',
      'summarize-notes',
      'calculation-assistant',
      'report-writer',
    ];
    const actualIds = AI_STUDY_RESOURCES.map((r) => r.id);
    assert.deepStrictEqual(actualIds, expectedIds);
  });

  await t.test('does not contain obsolete prompt library resources', () => {
    const titles = AI_STUDY_RESOURCES.map((r) => r.title.toLowerCase());
    assert.strictEqual(titles.some((t) => t.includes('marking')), false);
    assert.strictEqual(titles.some((t) => t.includes('attempted answers')), false);
  });

  await t.test('1. Explain Difficult Topics prompt includes first principles, analogies, and exam checklist', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'explain-topics')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'EEE 311 Electric Circuit Theory',
      topic: 'Thevenin Theorem',
      style: 'Intuitive with physical analogies',
      specificQuestions: 'How do you calculate Rth when dependent sources exist?',
    });
    assert.ok(prompt.includes('EEE 311 Electric Circuit Theory'));
    assert.ok(prompt.includes('Thevenin Theorem'));
    assert.ok(prompt.includes('Core Intuition'));
    assert.ok(prompt.includes('Essential Definitions & Analogies'));
    assert.ok(prompt.includes('Exam Checklist'));
    assert.ok(prompt.includes('Never invent facts'));
  });

  await t.test('2. Break Down Problems Step by Step prompt enforces zero skipped steps and unit verification', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'break-down-problems')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'MTH 301',
      problemStatement: 'Solve d^2y/dx^2 + 4y = sin(2x)',
      givenValues: 'y(0)=1, y\'(0)=0',
      targetUnknowns: 'General and particular solution',
    });
    assert.ok(prompt.includes('Governing Formulas'));
    assert.ok(prompt.includes('Value Substitution'));
    assert.ok(prompt.includes('Never silently skip intermediate algebra'));
    assert.ok(prompt.includes('Final Answer & Verification'));
  });

  await t.test('3. Teach with Worked Examples prompt includes realistic exam problem, strategy, and reusable method', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'teach-worked-examples')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'CVE 202 Fluid Mechanics',
      concept: 'Bernoulli Equation with head losses',
      difficulty: 'Challenging Exam Level',
      focusArea: 'Venturi meter calculations',
    });
    assert.ok(prompt.includes('Examination-Standard Problem'));
    assert.ok(prompt.includes('Strategy Guide'));
    assert.ok(prompt.includes('Complete Line-by-Line Solution'));
    assert.ok(prompt.includes('Reusable General Method'));
  });

  await t.test('4. Practice Questions with Answer Key separates questions first and uses exact divider', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'practice-questions')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'CHE 305 Reaction Kinetics',
      topic: 'Arrhenius equation and activation energy',
      count: 6,
      difficulty: 'Exam Prep',
      questionTypes: 'Multiple Choice & Quantitative',
    });
    assert.ok(prompt.includes('Present ALL 6 questions FIRST'));
    assert.ok(prompt.includes('--- ANSWER KEY & FULL EXPLANATIONS ---'));
    assert.ok(prompt.includes('Underneath the divider, provide the full answer key'));
  });

  await t.test('5. Generate Flashcards prompt enforces atomic Q&A cards', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'generate-flashcards')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'MEG 211 Thermodynamics',
      topic: 'Carnot Cycle',
      notes: 'Entropy changes in reversible isothermal processes',
      count: 5,
    });
    assert.ok(prompt.includes('Card 1:'));
    assert.ok(prompt.includes('Q:'));
    assert.ok(prompt.includes('A:'));
    assert.ok(prompt.includes('active recall'));
  });

  await t.test('6. Summarize and Simplify Lecture Notes enforces formula table and anti-fabrication', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'summarize-notes')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'EEE 321 Electromagnetics',
      topicTitle: 'Maxwell Equations',
      notes: 'Gauss Law, Faraday Law, Ampere Law with Maxwell correction',
      focus: 'Exam Revision Checklist',
    });
    assert.ok(prompt.includes('Governing Equations & Formulas'));
    assert.ok(prompt.includes('structured markdown table'));
    assert.ok(prompt.includes('Never invent content that is absent from supplied notes'));
  });

  await t.test('7. Calculation Assistant prompt enforces strict 8-step structured workflow', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'calculation-assistant')!;
    assert.ok(res);
    const prompt = res.buildPrompt({
      course: 'PHY 101 Mechanics',
      calculationTask: 'Calculate kinetic energy and power required',
      givenValues: 'm = 1200 kg, v0 = 0, v = 25 m/s, t = 8 s',
      targetQuantity: 'Total work done and average power in kW',
    });
    assert.ok(prompt.includes('exact 8-part structure'));
    assert.ok(prompt.includes('1. Given Values'));
    assert.ok(prompt.includes('2. Required Quantity'));
    assert.ok(prompt.includes('3. Governing Formula'));
    assert.ok(prompt.includes('4. Unit Conversions'));
    assert.ok(prompt.includes('5. Value Substitution'));
    assert.ok(prompt.includes('6. Step-by-Step Calculation'));
    assert.ok(prompt.includes('7. Final Answer'));
    assert.ok(prompt.includes('8. Reasonableness & Sanity Check'));
    assert.ok(prompt.includes('Never fabricate measurements'));
  });

  await t.test('8. Practical and Project Report Writer strictly supports two report types and forbids fabrication', () => {
    const res = AI_STUDY_RESOURCES.find((r) => r.id === 'report-writer')!;
    assert.ok(res);

    // Laboratory Practical Report
    const labPrompt = res.buildPrompt({
      reportType: 'Laboratory Practical Report',
      course: 'EEE 291 Electrical Engineering Lab I',
      title: 'Verification of Kirchhoff Laws',
      aim: 'To verify KVL and KCL in a 2-loop resistive network',
      instructions: 'Use DC power supply at 10V, R1=100, R2=220, R3=330',
      findings: 'Loop 1 voltage drop measured 9.95V, Loop 2 measured 9.98V',
    });
    assert.ok(labPrompt.includes('Laboratory Practical Report'));
    assert.ok(labPrompt.includes('NEVER invent laboratory measurements'));
    assert.ok(labPrompt.includes('bracketed placeholders'));
    assert.ok(labPrompt.includes('Apparatus & Materials'));
    assert.ok(labPrompt.includes('Sources of Experimental Error'));

    // Academic Project Report with Lecturer Format override
    const projectPrompt = res.buildPrompt({
      reportType: 'Academic Project Report',
      course: 'CPE 499 Capstone Project',
      title: 'Solar Inverter Monitoring System',
      aim: 'Design an IoT data logger for solar PV arrays',
      lecturerFormat: '1. Executive Summary\n2. System Architecture\n3. Hardware Schematics\n4. Cost Analysis',
    });
    assert.ok(projectPrompt.includes('Academic Project Report'));
    assert.ok(projectPrompt.includes('lecturer\'s supplied format specified above takes primary precedence'));
    assert.ok(projectPrompt.includes('Executive Summary'));
  });
});

test('parseFlashcards utility', async (t) => {
  await t.test('parses standard Q: and A: blocks correctly', () => {
    const raw = `
Card 1:
Q: What is Ohm's Law?
A: V = I * R, stating that current through a conductor is directly proportional to voltage across it.

Card 2:
Q: What is the SI unit of electrical resistance?
A: The Ohm (symbol: Ω).

Card 3:
Q: Define Kirchhoff's Current Law (KCL).
A: The algebraic sum of all currents entering and exiting any node in an electrical circuit is zero.
`;
    const cards = parseFlashcards(raw);
    assert.strictEqual(cards.length, 3);
    assert.strictEqual(cards[0].question, "What is Ohm's Law?");
    assert.ok(cards[0].answer.includes('V = I * R'));
    assert.strictEqual(cards[1].question, 'What is the SI unit of electrical resistance?');
    assert.ok(cards[1].answer.includes('Ohm'));
    assert.strictEqual(cards[2].question, "Define Kirchhoff's Current Law (KCL).");
    assert.ok(cards[2].answer.includes('sum of all currents'));
  });

  await t.test('handles Front: and Back: formatting gracefully', () => {
    const raw = `
Question 1:
Front: What is the speed of light in vacuum?
Back: 2.998 x 10^8 m/s.
`;
    const cards = parseFlashcards(raw);
    assert.strictEqual(cards.length, 1);
    assert.strictEqual(cards[0].question, 'What is the speed of light in vacuum?');
    assert.strictEqual(cards[0].answer, '2.998 x 10^8 m/s.');
  });

  await t.test('returns empty array on empty or unparseable input', () => {
    assert.deepStrictEqual(parseFlashcards(''), []);
    assert.deepStrictEqual(parseFlashcards('Just a plain text lecture without Q and A markers.'), []);
  });
});
