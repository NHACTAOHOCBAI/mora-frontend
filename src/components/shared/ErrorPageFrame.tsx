import type { ReactNode } from "react";

// This shell must work even when router, account or query providers have failed.
export const ErrorPageFrame = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col bg-background text-foreground">
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-card px-4 md:px-6">
      <a href="/" className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
        <span className="flex size-9 items-center justify-center rounded-lg border bg-muted p-1"><img src="/frog-logo.png" alt="" className="size-7 object-contain dark:invert" /></span>
        <span className="text-lg font-semibold tracking-tight">Mora</span>
      </a>
    </header>
    <main className="flex flex-1 flex-col">{children}</main>
    <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Mora. Tất cả các quyền được bảo lưu.</footer>
  </div>
);
