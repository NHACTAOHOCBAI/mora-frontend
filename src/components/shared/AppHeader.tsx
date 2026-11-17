import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  context?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
}

export const AppHeader = ({ context, navigation, actions }: AppHeaderProps) => (
  <header className="sticky top-0 z-50 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-border bg-card px-3 text-foreground md:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
    <div className="col-start-1 row-start-1 flex h-16 min-w-0 items-center gap-2 lg:max-w-96 lg:gap-3">
      <Link
        to="/"
        aria-label="Về danh sách không gian"
        className="inline-flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-1">
          <img src="/frog-logo.png" alt="" className="size-7 object-contain dark:invert" />
        </span>
        {!context && <span className="text-lg font-semibold tracking-tight">Mora</span>}
      </Link>
      {context}
    </div>
    {navigation && (
      <div className="col-start-1 row-start-2 flex h-11 min-w-0 items-center lg:col-start-2 lg:row-start-1 lg:ml-3 lg:h-16">
        {navigation}
      </div>
    )}
    {actions && (
      <div className="col-start-2 row-start-2 flex h-11 items-center justify-end lg:col-start-3 lg:row-start-1 lg:h-16">
        {actions}
      </div>
    )}
    <div className={`col-start-2 row-start-1 flex h-16 shrink-0 items-center justify-end gap-1 sm:gap-3 lg:col-start-4 ${actions ? "lg:relative lg:pl-4 lg:before:absolute lg:before:left-0 lg:before:h-5 lg:before:w-px lg:before:bg-border" : ""}`}>
      <ThemeToggle />
      <UserMenu />
    </div>
  </header>
);
