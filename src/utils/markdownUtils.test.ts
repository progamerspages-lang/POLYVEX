import test from 'node:test';
import assert from 'node:assert/strict';
import { preprocessMarkdown } from './markdownUtils.tsx';

test('1. Normal paragraph with headings and bullet points', () => {
  const input = `### Engineering Mechanics
This is a standard introductory paragraph explaining statics and dynamics.

* Newton's First Law: Inertia
* Newton's Second Law: F = ma
* Newton's Third Law: Action and reaction`;

  const output = preprocessMarkdown(input);
  assert.equal(output, input);
});

test('2. Response containing literal <br> and &lt;br&gt; formatting artifacts', () => {
  // Test 2a: Awkward numbered list items with <br>
  const listInput = `1.<br>First step in the protocol
2. <br> Second step in the protocol
3. Third step`;
  const listOutput = preprocessMarkdown(listInput);
  assert.match(listOutput, /1\. First step in the protocol/);
  assert.match(listOutput, /2\. Second step in the protocol/);
  assert.doesNotMatch(listOutput, /1\.<br>/);

  // Test 2b: Prose with single and repeated <br>
  const proseInput = `Line 1<br>Line 2<br><br>Paragraph 2 with &lt;br&gt; inside`;
  const proseOutput = preprocessMarkdown(proseInput);
  assert.doesNotMatch(proseOutput, /<br>/i);
  assert.doesNotMatch(proseOutput, /&lt;br&gt;/i);
  assert.match(proseOutput, /Line 1 {2}\nLine 2/);
  assert.match(proseOutput, /\n\nParagraph 2/);
});

test('3. Wide Markdown table with long text, URLs, and cell breaks', () => {
  const tableInput = `| Module | Specification | Notes & Documentation |
|---|---|---|
| Microcontroller | STM32F401RE<br>84MHz ARM Cortex-M4 | Official reference: https://st.com/stm32f401<br>Requires 3.3V power |
| Sensor Array | I2C Digital Barometer<br>BMP280 | High precision altimeter: https://bosch.com/bmp280 |`;

  const output = preprocessMarkdown(tableInput);
  // Table rows must remain intact on single lines with <br /> markers
  const lines = output.trim().split('\n');
  assert.equal(lines.length, 4, 'Table must retain exactly 4 rows without breaking syntax');
  assert.match(output, /STM32F401RE<br \/>84MHz/);
  assert.match(output, /https:\/\/st\.com\/stm32f401/);
});

test('4. Code containing HTML tags that must remain literal', () => {
  // Fenced code block with raw HTML tags
  const codeBlockInput = `Here is sample HTML code:
\`\`\`html
<div class="card">
  <h3>Title</h3>
  <br>
  <p>Paragraph with literal &lt;br&gt; tag</p>
</div>
\`\`\`
Followed by regular explanation.`;

  const output = preprocessMarkdown(codeBlockInput);
  assert.match(output, /```html\n<div class="card">\n  <h3>Title<\/h3>\n  <br>\n  <p>Paragraph with literal &lt;br&gt; tag<\/p>\n<\/div>\n```/);

  // Inline code with literal <br>
  const inlineInput = `Use the \`<br>\` or \`<br/>\` tag for HTML line breaks.`;
  const inlineOutput = preprocessMarkdown(inlineInput);
  assert.match(inlineOutput, /` <br> `|`<br>`/);
});

test('5. Engineering equations and mathematical notation', () => {
  const mathInput = `In circuit analysis where $V = IR$:
If current $I < 2\\text{A}$ and resistance $R > 50\\Omega$, then voltage drop $V > 100\\text{V}$.
Also for inequalities: $x < y < z$ and matrices $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$.`;

  const output = preprocessMarkdown(mathInput);
  assert.equal(output, mathInput, 'Mathematical inequalities (< and >) must not be corrupted');
});

test('6. Long answer while streaming chunks', () => {
  const chunks = [
    '### Step-by-step',
    ' Analysis\n\n',
    '1.<br>First observe',
    ' the circuit diagram.<br>',
    '2. Apply Kirchhoff',
    '\'s Voltage Law (KVL):<br><br>',
    '$$\\sum V = 0$$\n\n',
    '| Loop | Equation |\n',
    '|---|---|\n',
    '| Loop 1 | $V_1 - I_1 R_1 = 0$<br>Active |',
  ];

  let accumulated = '';
  for (const chunk of chunks) {
    accumulated += chunk;
    const partialProcessed = preprocessMarkdown(accumulated);
    assert.doesNotMatch(partialProcessed, /1\.<br>/);
    assert.doesNotMatch(partialProcessed, /<br><br>/);
  }

  const finalProcessed = preprocessMarkdown(accumulated);
  assert.match(finalProcessed, /1\. First observe/);
  assert.match(finalProcessed, /2\. Apply Kirchhoff/);
  assert.match(finalProcessed, /Loop 1/);
});

test('7. Clean duplicate numbered list item prefixes', () => {
  const input = `1. 1. Identify given parameters
2. 2) Calculate nodal voltages
3. 3. Verify total power balance`;

  const output = preprocessMarkdown(input);
  assert.match(output, /1\. Identify given parameters/);
  assert.match(output, /2\. Calculate nodal voltages/);
  assert.match(output, /3\. Verify total power balance/);
  assert.doesNotMatch(output, /1\. 1\./);
  assert.doesNotMatch(output, /2\. 2\)/);
});

test('8. Normalize LaTeX block and inline delimiters (\\[...\\] and \\(...\\))', () => {
  const input = `The quadratic formula solves \\(ax^2 + bx + c = 0\\):

\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]

Where \\(a \\neq 0\\).`;

  const output = preprocessMarkdown(input);
  assert.match(output, /\$ax\^2 \+ bx \+ c = 0\$/);
  assert.match(output, /\$\$x = \\frac\{-b \\pm \\sqrt\{b\^2 - 4ac\}\}\{2a\}\$\$/);
  assert.match(output, /\$a \\neq 0\$/);
});


