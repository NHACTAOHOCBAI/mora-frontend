import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddSpaceMember } from "../hooks/useSpace";
import { MemberRoleChoices } from "./MemberRoleSelect";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

const addSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống").email("Email không hợp lệ"),
  role: z.enum(["EDITOR", "VIEWER"]),
});
type AddValues = z.infer<typeof addSchema>;
interface AddSpaceMemberFormProps {
  spaceId: number;
  onAdded: () => void;
}
export function AddSpaceMemberForm({
  spaceId,
  onAdded,
}: AddSpaceMemberFormProps) {
  const add = useAddSpaceMember();
  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { email: "", role: "EDITOR" },
  });
  const submit = form.handleSubmit((values) => {
    form.clearErrors("root");
    add.mutate(
      { spaceId, data: values },
      {
        onSuccess: (member) => {
          toast.success(`Đã gửi lời mời đến ${member.inviteeEmail}`);
          onAdded();
        },
        onError: (error) =>
          form.setError("root", { message: getErrorMessage(error) }),
      },
    );
  });
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="member-account" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="member-account"
          type="email"
          {...form.register("email")}
          disabled={add.isPending}
          placeholder="Ví dụ: ban@example.com"
          aria-invalid={!!form.formState.errors.email}
          aria-describedby="member-account-hint member-account-error"
          className="h-10"
        />
        <p
          id="member-account-hint"
          className="text-xs text-muted-foreground leading-5"
        >
          Người nhận cần có tài khoản Mora và sẽ tự xác nhận trước khi tham gia.
        </p>
        {form.formState.errors.email && (
          <p
            id="member-account-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => (
          <MemberRoleChoices
            name="member-role"
            value={field.value}
            onChange={field.onChange}
            disabled={add.isPending}
          />
        )}
      />
      {form.formState.errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button type="submit" className="h-10 w-full" disabled={add.isPending}>
        {add.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {add.isPending ? "Đang gửi..." : "Gửi lời mời"}
      </Button>
    </form>
  );
}
