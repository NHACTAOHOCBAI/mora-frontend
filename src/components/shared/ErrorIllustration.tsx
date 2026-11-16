import type { ReactNode } from "react";

export type ErrorIllustrationKind = "missing" | "forbidden" | "connection" | "unexpected"
  | "workspace-missing" | "workspace-forbidden" | "workspace-connection" | "invitation" | "reset-link";

export const ErrorIllustration = ({ kind, code, icon }: {
  kind: ErrorIllustrationKind;
  code?: string;
  icon: ReactNode;
}) => (
  <div aria-hidden="true" data-illustration={kind} className="relative isolate h-44 w-72 max-w-full shrink-0 sm:h-52 sm:w-96">
    {code && <span className="absolute inset-x-0 -top-4 select-none text-center text-[120px] font-bold leading-none tracking-tighter text-foreground/[0.055] sm:text-[156px]">{code}</span>}
    <svg viewBox="0 0 360 190" fill="none" className="absolute inset-0 size-full text-foreground/35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="174" cy="169" rx="112" ry="8" className="fill-muted/70 stroke-none" />
      <path d="M62 161h238" />
      <circle cx="76" cy="77" r="3" /><path d="M300 111h8m-4-4v8M94 34h8m-4-4v8" />
      {kind.startsWith("workspace-") ? (
        <g>
          <path d="M201 91V72a6 6 0 0 1 6-6h27l10 11h43a6 6 0 0 1 6 6v71" className="fill-background" />
          <path d="M201 94h95l-10 65h-77z" className="fill-muted" />
          {kind === "workspace-missing" ? <>
            <path d="m222 54 3-20h28l12 15-3 23m-34-27h14m-15 8h17" />
            <circle cx="246" cy="125" r="12" /><path d="m255 134 12 13" />
          </> : kind === "workspace-forbidden" ? <>
            <rect x="234" y="115" width="28" height="26" rx="5" className="fill-background" />
            <path d="M240 115v-7a8 8 0 0 1 16 0v7m-8 12v5" />
          </> : <>
            <path d="M226 125h15v-13h-15zm4-13v-7m7 7v-7M254 125h15v13h-15zm4 13v7m7-7v7m-17-29 3-6m-3 22 3 6" className="fill-background" />
          </>}
        </g>
      ) : kind === "invitation" ? (
        <g transform="rotate(7 246 110)">
          <path d="M205 79h85v25a9 9 0 0 0 0 18v27h-85v-27a9 9 0 0 0 0-18z" className="fill-background" />
          <path d="M261 81v66" strokeDasharray="3 5" /><path d="M218 98h29m-29 9h19m-19 9h24" />
          <circle cx="279" cy="142" r="19" className="fill-background" /><path d="M279 132v11l7 4" />
        </g>
      ) : kind === "reset-link" ? (
        <g>
          <circle cx="231" cy="87" r="19" className="fill-background" /><circle cx="231" cy="87" r="6" />
          <path d="m244 100 28 28-6 6-7-7-5 5-10-10m-4-30 6-6" />
          <path d="m211 136 8-8a10 10 0 0 1 14 0m10 10a10 10 0 0 1 0 14l-8 8m-12-18-6 6m18-17 6-6m-3-8 3-7m8 13 7-2" />
        </g>
      ) : kind === "missing" ? (
        <g transform="rotate(9 244 109)">
          <path d="M213 53h43l20 22v82h-63z" className="fill-background" />
          <path d="M256 53v22h20M226 91h35M226 102h27M226 114h18" />
          <circle cx="255" cy="139" r="11" /><path d="m263 147 9 9" />
        </g>
      ) : kind === "forbidden" ? (
        <g>
          <path d="M213 159V51a7 7 0 0 1 7-7h58a7 7 0 0 1 7 7v108" className="fill-background" />
          <path d="M221 159V53h56v106M229 59h39" />
          <rect x="233" y="100" width="31" height="28" rx="5" className="fill-muted" />
          <path d="M240 100v-8a9 9 0 0 1 18 0v8m-9 12v5" />
        </g>
      ) : kind === "connection" ? (
        <g>
          <path d="M211 153h28a14 14 0 0 0 14-14v-14m0-27V80a15 15 0 0 1 15-15h20" strokeDasharray="4 6" />
          <path d="M242 122h22v-13h-22zm5 0v8m12-8v8M242 100h22V87h-22zm5-13v-8m12 8v-8" className="fill-background" />
          <path d="m235 103-6-3m43 3 6-3" />
        </g>
      ) : (
        <g transform="rotate(6 247 110)">
          <rect x="210" y="61" width="78" height="95" rx="8" className="fill-background" />
          <path d="M210 81h78m-67-10h1m7 0h1m7 0h1M249 100v22m0 10v1" />
        </g>
      )}
      <path d="M169 144c17-7 17-25 37-27" strokeDasharray="3 6" />
    </svg>
    <img src="/frog-logo.png" alt="" className="absolute bottom-7 left-[21%] size-20 object-contain dark:invert sm:bottom-8 sm:size-24" />
    <span className="absolute right-[16%] top-6 flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs [&_svg]:size-4 sm:top-8">{icon}</span>
  </div>
);
