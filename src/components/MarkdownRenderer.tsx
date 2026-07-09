import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => (
          <p className="text-sm text-zinc-100 leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-100">{children}</em>
        ),
        code: ({
          children,
          className,
        }: {
          children?: React.ReactNode;
          className?: string;
        }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto">
              <code className="text-xs text-zinc-200 font-mono leading-relaxed">
                {children}
              </code>
            </pre>
          );
        },
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-zinc-100 space-y-1 mb-2 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-zinc-100 space-y-1 mb-2 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-sm text-zinc-100">{children}</li>,
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-white mt-3 mb-1.5">{children}</h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
