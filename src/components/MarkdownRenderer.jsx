'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders markdown content with proper styling for study notes.
 * Supports: headings, tables, lists, bold, inline code, blockquotes, horizontal rules.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="md-notes">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
