import { useEffect, useRef, type ReactNode } from "react";

import { ErrorIllustration, type ErrorIllustrationKind } from "./ErrorIllustration";

interface ErrorViewProps {
  icon: ReactNode;
  title: string;
  description: string;
  code?: string;
  illustration?: ErrorIllustrationKind;
  children: ReactNode;
}
export const ErrorView = ({ icon, title, description, code, children, illustration }: ErrorViewProps) => {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return (
    <div className="relative isolate flex w-full min-w-0 flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 text-foreground opacity-[0.06] [background-image:radial-gradient(currentColor_0.8px,transparent_0.8px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <section className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <ErrorIllustration code={code}
          kind={illustration || (code === "404" ? "missing" : code === "403" ? "forbidden" : "unexpected")} icon={icon} />
        <div className="flex flex-col items-center gap-3">
          <h1 ref={heading} tabIndex={-1} className="type-page-title outline-none">{title}</h1>
          <p className="max-w-md type-body-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="flex w-full max-w-60 flex-col gap-2 pt-1 [&_a]:inline-flex [&_a]:h-10 [&_a]:items-center [&_a]:justify-center [&_button]:h-10">{children}</div>
      </section>
    </div>
  );
};
