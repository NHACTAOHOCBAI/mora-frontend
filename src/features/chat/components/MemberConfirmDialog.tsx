import type { RefObject } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface MemberConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocus: RefObject<HTMLElement | null>;
}
export function MemberConfirmDialog({
  open,
  title,
  description,
  actionLabel,
  pending,
  error,
  onCancel,
  onConfirm,
  returnFocus,
}: MemberConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel();
      }}
    >
      <AlertDialogContent
        finalFocus={returnFocus}
        className="max-w-[calc(100vw-2rem)] sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <Button variant="outline" disabled={pending} onClick={onCancel}>
            Hủy
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Đang xử lý..." : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
