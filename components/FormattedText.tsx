import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Split by code blocks ```code```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-3 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const firstLineBreak = part.indexOf('\n');
          let language = '';
          let codeContent = '';

          if (firstLineBreak !== -1) {
            language = part.substring(3, firstLineBreak).trim();
            codeContent = part.substring(firstLineBreak + 1, part.length - 3);
          } else {
            codeContent = part.substring(3, part.length - 3);
          }

          return (
            <div key={index} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 my-3 shadow-inner">
              {language && (
                <div className="bg-slate-800/80 px-3 py-1 text-xs font-mono text-slate-300 border-b border-slate-700 flex items-center justify-between">
                  <span>{language}</span>
                  <span className="text-[10px] text-slate-400">code snippet</span>
                </div>
              )}
              <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                <code>{codeContent.trim()}</code>
              </pre>
            </div>
          );
        }

        // Handle inline code `code`
        const inlineParts = part.split(/(`[^`]+`)/g);

        return (
          <p key={index} className="whitespace-pre-line text-slate-800 text-sm sm:text-base">
            {inlineParts.map((sub, i) => {
              if (sub.startsWith('`') && sub.endsWith('`')) {
                return (
                  <code
                    key={i}
                    className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-xs sm:text-sm border border-slate-200 font-medium"
                  >
                    {sub.slice(1, -1)}
                  </code>
                );
              }
              return sub;
            })}
          </p>
        );
      })}
    </div>
  );
}
