import React from 'react';

/**
 * Preprocesses markdown text returned by AI models to clean raw formatting artifacts
 * such as literal `<br>`, `<br/>`, `&lt;br&gt;`, and malformed list prefixes,
 * while STRICTLY preserving:
 * 1. Fenced code blocks (```...```)
 * 2. Inline code (`...`)
 * 3. Mathematical inequalities (e.g. x < 5, y > 10)
 * 4. User-requested literal markup and code examples
 */
export function preprocessMarkdown(text: string): string {
  if (!text) return '';

  // Split into code segments and non-code segments to guarantee code blocks are untouched
  const parts: Array<{ type: 'code' | 'text'; content: string }> = [];
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  const processed = parts.map((part) => {
    if (part.type === 'code') {
      // Return code exactly as-is: preserve all HTML tags, brackets, and syntax
      return part.content;
    }

    let s = part.content;

    // Normalize LaTeX delimiters in non-code text:
    // 1. Convert \[ ... \] to $$ ... $$
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$${math.trim()}$$\n\n`);
    // 2. Convert \( ... \) to $ ... $
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

    // 0. Clean duplicate list item number prefixes (e.g., "1. 1. Item" or "1. 1) Item")
    s = s.replace(/(\n|^)(\s*\d+[\.\)])\s*(?:\d+[\.\)]\s*)+/g, '$1$2 ');

    // 1. Fix awkward numbered list items where model inserted <br> right after number: e.g. "1.<br>" or "1. <br>"
    s = s.replace(/(\n|^)(\s*\d+[\.\)])\s*(?:<br\s*\/?>|&lt;br\s*\/?&gt;)+\s*/gi, '$1$2 ');

    // 2. Fix bullet list items with <br>: e.g. "- <br>" or "* <br>"
    s = s.replace(/(\n|^)(\s*[-*+])\s*(?:<br\s*\/?>|&lt;br\s*\/?&gt;)+\s*/gi, '$1$2 ');

    // 3. Process line by line to differentiate Markdown tables from standard prose
    const lines = s.split('\n');
    const processedLines = lines.map((line) => {
      // Check if line is part of a markdown table (starts or ends with | or contains multiple | delimiters)
      if (line.includes('|')) {
        // In tables, standard newlines would break table rows across lines.
        // Convert any <br>, <br/>, &lt;br&gt; or repeats into a single clean <br /> marker
        // that our custom table cell renderer will cleanly render as React <br />
        return line.replace(/(?:\s*<br\s*\/?>\s*|\s*&lt;br\s*\/?&gt;\s*)+/gi, '<br />');
      }

      // In prose:
      // A. Convert two or more consecutive breaks into a clean paragraph break (\n\n)
      let l = line.replace(/(?:\s*<br\s*\/?>\s*|\s*&lt;br\s*\/?&gt;\s*){2,}/gi, '\n\n');

      // B. Convert single <br> into standard markdown two-space line break
      l = l.replace(/(?:\s*<br\s*\/?>\s*|\s*&lt;br\s*\/?&gt;\s*)/gi, '  \n');

      return l;
    });

    return processedLines.join('\n');
  });

  return processed.join('');
}

/**
 * Safely renders string or array content containing `<br />` or residual break tags
 * into real React `<br />` elements without using dangerouslySetInnerHTML.
 */
export function renderCellWithBreaks(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    // Check if contains break tags
    if (/(?:<br\s*\/?>|&lt;br\s*\/?&gt;)/i.test(children)) {
      const parts = children.split(/(?:<br\s*\/?>|&lt;br\s*\/?&gt;)/gi);
      return parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <br className="my-0.5" />}
          {part}
        </React.Fragment>
      ));
    }
    return children;
  }

  if (Array.isArray(children)) {
    return children.map((c, idx) => (
      <React.Fragment key={idx}>{renderCellWithBreaks(c)}</React.Fragment>
    ));
  }

  return children;
}

/**
 * Unified ReactMarkdown component map for Polyvex UI components.
 * Enforces responsive table scrolling, semantic HTML lists, overflow protection,
 * and high-contrast dark theme styling.
 */
export const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="w-full min-w-0 max-w-full my-3.5 overflow-hidden rounded-xl border border-[#262A30] bg-[#101317]">
      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain scrollbar-thin">
        <table className="w-full min-w-full divide-y divide-[#262A30] border-collapse text-left text-xs sm:text-sm" {...props}>
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[#171A1E] border-b border-[#262A30] text-[#35F2D0] font-semibold text-xs tracking-wider" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-[#262A30]/50" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-[#1a1e24]/60 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-3.5 py-2.5 font-semibold text-[#35F2D0] whitespace-nowrap text-xs" {...props}>
      {renderCellWithBreaks(children)}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3.5 py-2.5 text-xs text-[#F5F7FA] align-top break-words [overflow-wrap:anywhere] max-w-[280px] sm:max-w-none" {...props}>
      {renderCellWithBreaks(children)}
    </td>
  ),
  pre: ({ children, ...props }: any) => (
    <div className="w-full min-w-0 max-w-full my-3 overflow-hidden rounded-xl bg-[#090B0D] border border-[#262A30]">
      <div className="w-full min-w-0 max-w-full overflow-x-auto p-3.5 text-xs font-mono scrollbar-thin">
        <pre className="max-w-full whitespace-pre break-normal" {...props}>
          {children}
        </pre>
      </div>
    </div>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline || (!className && typeof children === 'string' && !children.includes('\n'))) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-[#171A1E] text-[#35F2D0] font-mono text-[0.85em] border border-[#262A30] break-words [overflow-wrap:anywhere]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`block text-xs font-mono text-[#F5F7FA] ${className || ''}`} {...props}>
        {children}
      </code>
    );
  },
  ol: ({ children, start, ...props }: any) => (
    <ol
      start={start}
      className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 text-[#F5F7FA]"
      {...props}
    >
      {children}
    </ol>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-[#F5F7FA]" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed pl-1 marker:text-[#35F2D0] marker:font-semibold" {...props}>
      {renderCellWithBreaks(children)}
    </li>
  ),
  p: ({ children, ...props }: any) => (
    <p className="leading-relaxed mb-2.5 last:mb-0 break-words [overflow-wrap:anywhere]" {...props}>
      {renderCellWithBreaks(children)}
    </p>
  ),
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#35F2D0] underline hover:text-[#35F2D0]/80 transition break-all [overflow-wrap:anywhere] cursor-pointer"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl sm:text-2xl font-black text-[#F5F7FA] mt-4 mb-2 pb-1.5 border-b border-[#262A30] break-words" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg sm:text-xl font-bold text-[#35F2D0] mt-3.5 mb-2 break-words" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base sm:text-lg font-semibold text-[#F5F7FA] mt-3 mb-1.5 break-words" {...props}>
      {children}
    </h3>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-2 border-[#35F2D0] pl-3.5 py-1.5 my-3 text-[#A1A8B3] italic bg-[#101317]/60 rounded-r-xl break-words"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-[#262A30]" />,
};

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Shared, production-grade AI response renderer for POLYVEX.
 * Handles Markdown, GFM tables, KaTeX inline/block mathematics, code blocks, and overflow containment.
 */
export const PolyvexMarkdown: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const cleanedText = preprocessMarkdown(text);
  return (
    <div className={`w-full min-w-0 max-w-full font-sans text-sm sm:text-base text-[#F5F7FA] space-y-3 selection:bg-[#35F2D0]/30 markdown-body break-words [overflow-wrap:anywhere] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {cleanedText}
      </ReactMarkdown>
    </div>
  );
};


