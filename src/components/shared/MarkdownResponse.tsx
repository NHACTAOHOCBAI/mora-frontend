import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Consistent, safe presentation for model-generated Markdown. */
export function MarkdownResponse({ text }: { text: string }) {
  return (
    <div className="markdown-response">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-6">{children}</p>,
        h1: ({ children }) => <h1 className="mt-6 mb-3 text-xl font-semibold leading-7 tracking-tight first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mt-5 mb-2.5 text-lg font-semibold leading-6 tracking-tight first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-4 mb-2 text-base font-semibold leading-6 first:mt-0">{children}</h3>,
        h4: ({ children }) => <h4 className="mt-3 mb-1.5 text-sm font-semibold leading-5 first:mt-0">{children}</h4>,
        h5: ({ children }) => <h5 className="mt-3 mb-1 text-sm font-medium leading-5 first:mt-0">{children}</h5>,
        h6: ({ children }) => <h6 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">{children}</h6>,
        ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-5 marker:text-muted-foreground [&_ul]:mb-0 [&_ul]:mt-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground [&_ol]:mb-0 [&_ol]:mt-1.5">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5 leading-6">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">{children}</a>,
        blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-primary/40 bg-muted/40 py-1 pl-3 text-muted-foreground [&_p]:mb-0">{children}</blockquote>,
        hr: () => <hr className="my-5 border-border" />,
        pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2.5 font-mono text-xs leading-5">{children}</pre>,
        code: ({ className, children }) => <code className={`rounded bg-muted px-1.5 py-0.5 font-mono text-[0.82em] text-foreground in-[pre]:bg-transparent in-[pre]:p-0 ${className ?? ""}`}>{children}</code>,
        table: ({ children }) => <div className="my-4 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-max border-collapse text-left text-sm leading-5">{children}</table></div>,
        thead: ({ children }) => <thead className="border-b border-border bg-muted/80 font-semibold">{children}</thead>,
        th: ({ children }) => <th className="border-r border-border px-3 py-2 last:border-r-0">{children}</th>,
        td: ({ children }) => <td className="border-r border-b border-border/60 px-3 py-2 align-top last:border-r-0">{children}</td>,
        tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
        input: ({ checked, ...props }) => <input {...props} checked={checked} readOnly className="mr-2 accent-primary" />,
        img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" className="my-3 max-h-96 max-w-full rounded-lg border border-border object-contain" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
