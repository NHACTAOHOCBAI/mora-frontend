import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddSpaceMember } from "../hooks/useSpace";
import { memberName } from "../utils/member-management";
import { MemberRoleChoices } from "./MemberRoleSelect";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

const addSchema = z.object({
  usernameOrEmail: z
    .string()
    .trim()
    .min(1, "Nhập email hoặc tên đăng nhập của người bạn muốn thêm."),
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
    defaultValues: { usernameOrEmail: "", role: "EDITOR" },
  });
  const submit = form.handleSubmit((values) => {
    form.clearErrors("root");
    add.mutate(
      { spaceId, data: values },
      {
        onSuccess: (member) => {
          toast.success(`Đã thêm ${memberName(member)} vào nhóm`);
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
          Email hoặc tên đăng nhập
        </label>
        <Input
          id="member-account"
          {...form.register("usernameOrEmail")}
          disabled={add.isPending}
          placeholder="Ví dụ: ban@example.com"
          aria-invalid={!!form.formState.errors.usernameOrEmail}
          aria-describedby="member-account-hint member-account-error"
          className="h-10"
        />
        <p
          id="member-account-hint"
          className="text-xs text-muted-foreground leading-5"
        >
          Người được thêm cần có tài khoản Mora. Họ sẽ được thêm ngay, không cần
          chấp nhận lời mời.
        </p>
        {form.formState.errors.usernameOrEmail && (
          <p
            id="member-account-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {form.formState.errors.usernameOrEmail.message}
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
        {add.isPending ? "Đang thêm..." : "Thêm thành viên"}
      </Button>
    </form>
  );
}
