import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Copy,
  Link as LinkIcon,
  Loader2,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  useSpaceInvitations,
  useCreateSpaceInvitation,
  useRevokeSpaceInvitation,
} from "../hooks/useSpace";
import type { SpaceInvitationResponse } from "../types";
import { isActiveInvitation } from "../utils/member-management";
import { MemberRoleBadge, MemberRoleChoices } from "./MemberRoleSelect";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

const inviteSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
  duration: z.enum(["7", "30", "0"]),
});
type InviteValues = z.infer<typeof inviteSchema>;
interface MemberInvitationPanelProps {
  spaceId: number;
  open: boolean;
}

export function MemberInvitationPanel({
  spaceId,
  open,
}: MemberInvitationPanelProps) {
  const invitations = useSpaceInvitations(spaceId, { enabled: open });
  const create = useCreateSpaceInvitation();
  const revoke = useRevokeSpaceInvitation();
  const [created, setCreated] = useState<SpaceInvitationResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<SpaceInvitationResponse | null>(
    null,
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const listTitleRef = useRef<HTMLHeadingElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "EDITOR", duration: "7" },
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(timer);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);
  const active = (invitations.data || []).filter((inv) =>
    isActiveInvitation(inv, now),
  );
  const createdActive =
    created && isActiveInvitation(created, now) ? created : null;
  const joinUrl = (code: string) => `${window.location.origin}/join/${code}`;
  const copy = async (code: string) => {
    setCopyError(null);
    setCopiedCode(null);
    try {
      await navigator.clipboard.writeText(joinUrl(code));
      setCopiedCode(code);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedCode(null), 3000);
      toast.success("Đã sao chép liên kết");
    } catch {
      setCopyError(
        "Không thể sao chép. Hãy cho phép trình duyệt truy cập bộ nhớ tạm và thử lại.",
      );
    }
  };
  const submit = (values: InviteValues) => {
    form.clearErrors("root");
    create.mutate(
      {
        spaceId,
        data: { role: values.role, durationDays: Number(values.duration) },
      },
      {
        onSuccess: (invitation) => {
          setCreated(invitation);
          setCopiedCode(null);
          setCopyError(null);
          toast.success("Đã tạo liên kết mời");
        },
        onError: (error) =>
          form.setError("root", { message: getErrorMessage(error) }),
      },
    );
  };
  const confirmRevoke = () => {
    if (!revoking) return;
    setConfirmError(null);
    revoke.mutate(
      { spaceId, invitationId: revoking.id },
      {
        onSuccess: () => {
          if (created?.id === revoking.id) setCreated(null);
          setRevoking(null);
          toast.success("Đã thu hồi liên kết mời");
        },
        onError: (error) => setConfirmError(getErrorMessage(error)),
      },
    );
  };
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground leading-6">
        Gửi liên kết qua Messenger, Zalo hoặc email. Người nhận mở liên kết,
        đăng nhập và tham gia với quyền bạn chọn.
      </p>
      <form
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        className="space-y-4"
      >
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <MemberRoleChoices
              name="invite-role"
              value={field.value}
              onChange={field.onChange}
              disabled={create.isPending}
            />
          )}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
          <label htmlFor="invite-duration" className="text-sm font-medium">
            Liên kết có hiệu lực
          </label>
          <Controller
            control={form.control}
            name="duration"
            render={({ field }) => (
              <Select
                name={field.name}
                value={field.value}
                disabled={create.isPending}
                onValueChange={(value) => {
                  if (value === "7" || value === "30" || value === "0")
                    field.onChange(value);
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  id="invite-duration"
                  onBlur={field.onBlur}
                  className="h-9 w-40 bg-card"
                >
                  <SelectValue>
                    {field.value === "0"
                      ? "Không hết hạn"
                      : `${field.value} ngày`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="end">
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="0">Không hết hạn</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full h-10"
          disabled={create.isPending}
        >
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LinkIcon className="size-4" />
          )}
          {create.isPending ? "Đang tạo..." : "Tạo liên kết"}
        </Button>
      </form>
      {createdActive && (
        <section
          className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3"
          aria-label="Liên kết vừa tạo"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Check className="size-4" />
            <h3 className="text-sm font-semibold">Liên kết đã sẵn sàng</h3>
            <MemberRoleBadge role={createdActive.role} />
          </div>
          <label htmlFor="new-invite-url" className="sr-only">
            Liên kết vừa tạo
          </label>
          <Input
            id="new-invite-url"
            disabled
            value={joinUrl(createdActive.inviteCode)}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void copy(createdActive.inviteCode)}
          >
            {copiedCode === createdActive.inviteCode ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copiedCode === createdActive.inviteCode
              ? "Đã sao chép"
              : "Sao chép liên kết"}
          </Button>
        </section>
      )}
      {copyError && (
        <p role="alert" className="text-sm text-destructive">
          {copyError}
        </p>
      )}
      <section className="space-y-3" aria-labelledby="active-invites-title">
        <h3
          ref={listTitleRef}
          id="active-invites-title"
          tabIndex={-1}
          className="text-sm font-semibold outline-none"
        >
          Liên kết còn hiệu lực{invitations.data && ` (${active.length})`}
        </h3>
        {invitations.isLoading ? (
          <p role="status" className="text-sm text-muted-foreground py-4">
            Đang tải liên kết...
          </p>
        ) : invitations.isError ? (
          <div role="alert" className="rounded-xl border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Không tải được danh sách liên kết.
            </p>
            <Button
              variant="outline"
              onClick={() => void invitations.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : !active.length ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-5 text-center">
            Chưa có liên kết còn hiệu lực. Tạo liên kết để mời mọi người.
          </p>
        ) : (
          active.map((invitation) => (
            <div
              key={invitation.id}
              className="rounded-xl border border-border p-3 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MemberRoleBadge role={invitation.role} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {invitation.expiresAt
                    ? `Hết hạn ${new Date(invitation.expiresAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}`
                    : "Không hết hạn"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  disabled
                  aria-label={`Liên kết mời ${invitation.inviteCode}`}
                  value={joinUrl(invitation.inviteCode)}
                  className="min-w-0 flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Sao chép liên kết ${invitation.inviteCode}`}
                  onClick={() => void copy(invitation.inviteCode)}
                >
                  {copiedCode === invitation.inviteCode ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Thao tác liên kết ${invitation.inviteCode}`}
                    className="size-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setConfirmError(null);
                        setRevoking(invitation);
                      }}
                    >
                      Thu hồi liên kết
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </section>
      <MemberConfirmDialog
        open={!!revoking}
        title="Thu hồi liên kết mời?"
        description={`Liên kết ${revoking?.inviteCode || ""} sẽ không thể dùng để tham gia nữa. Thành viên đã tham gia vẫn ở trong nhóm.`}
        actionLabel="Thu hồi liên kết"
        pending={revoke.isPending}
        error={confirmError}
        onCancel={() => setRevoking(null)}
        onConfirm={confirmRevoke}
        returnFocus={listTitleRef}
      />
    </div>
  );
}
