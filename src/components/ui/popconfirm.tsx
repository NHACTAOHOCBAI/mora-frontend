import { useState, type ReactElement, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api-error";

interface PopconfirmProps {
  trigger: ReactElement;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  confirmDisabled?: boolean;
  pending?: boolean;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function Popconfirm({
  trigger,
  title,
  description,
  confirmLabel = "Xác nhận",
  onConfirm,
  confirmDisabled = false,
  pending = false,
  children,
  side = "bottom",
  align = "end",
}: PopconfirmProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = pending || submitting;

  const confirm = async () => {
    if (busy || confirmDisabled) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <PopoverPrimitive.Trigger render={trigger} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side={side} align={align} sideOffset={8} className="z-50">
          <PopoverPrimitive.Popup initialFocus className="w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <h3 className="text-sm font-semibold">{title}</h3>
            {description && <div className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</div>}
            {children && <div className="mt-3">{children}</div>}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="destructive" size="sm" disabled={busy || confirmDisabled} onClick={() => void confirm()}>
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                {busy ? "Đang xử lý..." : confirmLabel}
              </Button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
