import test from "node:test";
import assert from "node:assert/strict";
import { filterMembers, isActiveInvitation, memberName } from "../src/features/chat/utils/member-management.ts";

const members = [
  { id: 1, userId: 2, role: "VIEWER", email: "zoe@example.com", fullName: "Zoe" },
  { id: 2, userId: 3, role: "EDITOR", email: "anh@example.com", fullName: "Anh" },
  { id: 3, userId: 1, role: "OWNER", email: "owner@example.com", fullName: "Owner" },
  { id: 4, userId: 4, role: "EDITOR", email: "me@example.com", fullName: "Me" },
];
test("sorts owner, current member and remaining names without changing source", () => {
  assert.deepEqual(filterMembers(members, "", 4).map(member => member.userId), [1,4,3,2]);
  assert.equal(members[0].userId, 2);
});
test("searches case-insensitive trimmed names and account names", () => {
  assert.deepEqual(filterMembers(members, " ZOE@EXAMPLE ", 4).map(member => member.userId), [2]);
  assert.equal(filterMembers(members, "missing").length, 0);
  assert.equal(memberName({email:"fallback", fullName:"  "}), "Thành viên");
});
test("only pending invitations with a future or absent expiration are active", () => {
  const now = new Date("2026-11-16T12:00:00+07:00").getTime();
  assert.equal(isActiveInvitation({status:"PENDING"}, now), true);
  assert.equal(isActiveInvitation({status:"PENDING", expiresAt:"2026-11-17T00:00:00+07:00"}, now), true);
  for (const invitation of [{status:"REVOKED"}, {status:"ACCEPTED"}, {status:"EXPIRED"}, {status:"PENDING",expiresAt:"2026-11-16T12:00:00+07:00"}, {status:"PENDING",expiresAt:"invalid"}]) {
    assert.equal(isActiveInvitation(invitation, now), false);
  }
});
