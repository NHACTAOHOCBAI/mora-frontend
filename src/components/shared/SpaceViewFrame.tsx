import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpaceViewFrameProps = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  actions?: ReactNode;
  children: ReactNode;
  headingLevel?: "h1" | "h2";
  scrollable?: boolean;
  className?: string;
};

/** Shared content canvas for sibling views inside a Space workspace. */
export function SpaceViewFrame({
  title,
  description,
  icon: Icon,
  actions,
  children,
  headingLevel = "h2",
  scrollable = true,
  className,
}: SpaceViewFrameProps) {
  const Heading = headingLevel;

  return (
    <div className={cn("flex-1 min-h-0", scrollable && "overflow-y-auto")}>
      <div className={cn(
        "mx-auto w-full max-w-5xl p-5 md:p-10",
        scrollable ? "space-y-6" : "flex h-full min-h-0 flex-col gap-6",
        className,
      )}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Heading className="type-section-title flex items-center gap-2">
              <Icon className="size-5 text-primary" aria-hidden={true} />
              {title}
            </Heading>
            <p className="type-body mt-1 text-muted-foreground">{description}</p>
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}
