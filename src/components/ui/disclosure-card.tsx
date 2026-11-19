import { useId, useState, type ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';

export function DisclosureCard({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
        className="group flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-expanded:rounded-b-none"
      >
        <span className="min-w-0 break-words">{label}</span>
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform group-aria-expanded:rotate-180" />
      </button>
      <div id={panelId} hidden={!open} className="border-t p-3">
        {children}
      </div>
    </div>
  );
}
