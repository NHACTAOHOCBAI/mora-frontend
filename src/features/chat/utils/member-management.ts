import type {
  SpaceInvitationResponse,
  SpaceMemberResponse,
  SpaceRole,
} from "../types";

export const ROLE_DETAILS: Record<
  SpaceRole,
  { label: string; description: string }
> = {
  OWNER: {
    label: "Chủ nhóm",
    description:
      "Quản lý thành viên, quyền truy cập và tài liệu của không gian.",
  },
  EDITOR: {
    label: "Cộng tác viên",
    description: "Đọc, tải lên tài liệu, hỏi Mora và trao đổi nhóm.",
  },
  VIEWER: {
    label: "Người xem",
    description:
      "Đọc tài liệu, hỏi Mora và trao đổi nhóm; không tải lên tài liệu.",
  },
};
export function memberName(member: SpaceMemberResponse) {
  return member.fullName?.trim() || "Thành viên";
}
export function filterMembers(
  members: SpaceMemberResponse[],
  search: string,
  currentUserId?: number,
) {
  const query = search.trim().toLocaleLowerCase("vi");
  return members
    .filter((member) =>
      `${memberName(member)} ${member.email}`
        .toLocaleLowerCase("vi")
        .includes(query),
    )
    .sort((a, b) => {
      const rank = (member: SpaceMemberResponse) =>
        member.role === "OWNER" ? 0 : member.userId === currentUserId ? 1 : 2;
      return (
        rank(a) - rank(b) || memberName(a).localeCompare(memberName(b), "vi")
      );
    });
}
export function isActiveInvitation(
  invitation: SpaceInvitationResponse,
  now = Date.now(),
) {
  return (
    invitation.status === "PENDING" &&
    (!invitation.expiresAt || new Date(invitation.expiresAt).getTime() > now)
  );
}
