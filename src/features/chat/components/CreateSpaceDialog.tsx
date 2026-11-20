import { useRef } from "react";
import type { RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSpace } from "../hooks/useSpace";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import { useEntitlement } from '@/features/billing/hooks/useEntitlement';

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên không gian học tập.")
    .max(100, "Tên không được vượt quá 100 ký tự."),
  description: z
    .string()
    .trim()
    .max(1024, "Mô tả không được vượt quá 1024 ký tự."),
});
type CreateValues = z.infer<typeof createSchema>;
interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  returnFocus: RefObject<HTMLElement | null>;
}
export function CreateSpaceDialog({
  open,
  onOpenChange,
  onCreated,
  returnFocus,
}: CreateSpaceDialogProps) {
  const create = useCreateSpace();
  const entitlement = useEntitlement(open);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });
  const nameField = form.register("name");
  const submit = form.handleSubmit((values) => {
    form.clearErrors("root");
    create.mutate(values, {
      onSuccess: () => {
        form.reset();
        onCreated();
        onOpenChange(false);
        toast.success("Đã tạo không gian học tập");
      },
      onError: (error) =>
        form.setError("root", { message: getErrorMessage(error) }),
    });
  });
  const changeOpen = (next: boolean) => {
    if (create.isPending) return;
    if (!next) form.reset();
    onOpenChange(next);
  };
  const atSpaceLimit = !!entitlement.data && entitlement.data.ownedSpaces >= entitlement.data.maxOwnedSpaces;
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        className="sm:max-w-md rounded-2xl max-h-[85dvh] overflow-y-auto"
        initialFocus={nameRef}
        finalFocus={returnFocus}
      >
        <DialogHeader className="pr-6 gap-1">
          <DialogTitle className="text-base font-semibold">
            Tạo không gian
          </DialogTitle>
          <DialogDescription>
            Đặt tên theo môn học, chủ đề hoặc nhóm của bạn.
          </DialogDescription>
        </DialogHeader>
        {atSpaceLimit ? <div className="space-y-4"><div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p className="font-semibold">Bạn đã dùng hết số Space của gói {entitlement.data?.planName}.</p><p className="mt-1 text-muted-foreground">Kích hoạt gói khác để tạo thêm không gian học tập.</p></div><DialogFooter><Button type="button" variant="outline" onClick={() => changeOpen(false)}>Đóng</Button><Button render={<Link to="/plans" onClick={() => changeOpen(false)} />}><Sparkles className="size-4" />Xem gói</Button></DialogFooter></div> : <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="space-name" className="text-sm font-medium">
              Tên không gian
            </label>
            <Input
              id="space-name"
              {...nameField}
              ref={(element) => {
                nameField.ref(element);
                nameRef.current = element;
              }}
              disabled={create.isPending}
              placeholder="Ví dụ: Giải tích 1"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={
                form.formState.errors.name ? "space-name-error" : undefined
              }
            />
            {form.formState.errors.name && (
              <p
                id="space-name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="space-description" className="text-sm font-medium">
              Mô tả{" "}
              <span className="font-normal text-muted-foreground">
                (tùy chọn)
              </span>
            </label>
            <Textarea
              id="space-description"
              {...form.register("description")}
              rows={3}
              disabled={create.isPending}
              placeholder="Bạn sẽ học hoặc trao đổi nội dung gì?"
              className="resize-none"
              aria-invalid={!!form.formState.errors.description}
              aria-describedby={
                form.formState.errors.description
                  ? "space-description-error"
                  : undefined
              }
            />
            {form.formState.errors.description && (
              <p
                id="space-description-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          {form.formState.errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={create.isPending}
              onClick={() => changeOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {create.isPending ? "Đang tạo..." : "Tạo không gian"}
            </Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
