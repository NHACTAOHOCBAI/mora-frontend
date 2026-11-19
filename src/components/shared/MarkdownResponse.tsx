import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownResponse({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-5">{children}</p>
        ),
        h1: ({ children }) => (
          <h1 className="text-sm font-bold mt-3 mb-1.5 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xs font-bold mt-2.5 mb-1.5 text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xs font-semibold mt-2 mb-1 text-foreground">
            {children}
          </h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        pre: ({ children }) => (
          <pre className="bg-muted p-3 rounded-lg font-mono text-xs leading-5 overflow-x-auto my-2 border border-border">
            {children}
          </pre>
        ),
        code: ({ className, children }) => (
          <code className={`bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary in-[pre]:bg-transparent in-[pre]:p-0 in-[pre]:text-foreground ${className ?? ""}`}>
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 border border-border rounded-xl shadow-xs">
            <table className="w-full border-collapse text-left text-xs leading-5">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/80 border-b border-border font-semibold">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-bold text-foreground border-r border-border last:border-r-0">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 border-b border-border/50 border-r border-border/50 last:border-r-0 last:border-b-0 align-top">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-muted/30 transition-colors last:border-b-0">
            {children}
          </tr>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
