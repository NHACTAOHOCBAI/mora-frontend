import type { Message } from "../types";

export function getMessageKind(message: Message, membersCount: number) {
  if (message.sender === "assistant") return "AI_RESPONSE";
  if (message.messageType) return message.messageType;
  return membersCount === 1 || /^@(mora|ai)\b/i.test(message.text.trim())
    ? "AI_QUERY"
    : "USER_MESSAGE";
}

export function canGroupMessages(
  previous: Message | undefined,
  current: Message | undefined,
  membersCount: number,
): boolean {
  if (!previous || !current) return false;
  // AI answers keep their own identity and source controls. Unknown users must not merge.
  if (previous.sender === "assistant" || current.sender === "assistant")
    return false;
  if (previous.userId == null || current.userId == null) return false;
  if (previous.userId !== current.userId || previous.sender !== current.sender)
    return false;
  if (
    getMessageKind(previous, membersCount) !==
    getMessageKind(current, membersCount)
  )
    return false;
  const before = new Date(previous.timestamp);
  const after = new Date(current.timestamp);
  const elapsed = after.getTime() - before.getTime();
  return (
    Number.isFinite(elapsed) &&
    elapsed >= 0 &&
    elapsed <= 5 * 60 * 1000 &&
    before.toDateString() === after.toDateString()
  );
}
