import test from "node:test";
import assert from "node:assert/strict";
import {
  filterAndSortSpaces,
  canDeleteSpace,
} from "../src/features/chat/utils/space-list.ts";
const spaces = [
  { id: 1, name: "Zeta", createdAt: "2026-10-01", currentUserRole: "OWNER" },
  {
    id: 2,
    name: "Anh văn",
    createdAt: "2026-11-01",
    currentUserRole: "EDITOR",
  },
  {
    id: 3,
    name: "Nhóm chung",
    createdAt: "2026-11-10",
    currentUserRole: "VIEWER",
  },
];
test("defaults to newest and can sort alphabetically without mutating the source", () => {
  assert.deepEqual(
    filterAndSortSpaces(spaces, "", "newest").map((s) => s.id),
    [3, 2, 1],
  );
  assert.deepEqual(
    filterAndSortSpaces(spaces, "", "name").map((s) => s.id),
    [2, 3, 1],
  );
  assert.equal(spaces[0].id, 1);
});
test("filters names case-insensitively with trimmed search", () => {
  assert.deepEqual(
    filterAndSortSpaces(spaces, " NHÓM ", "newest").map((s) => s.id),
    [3],
  );
  assert.equal(filterAndSortSpaces(spaces, "missing", "name").length, 0);
  assert.equal(filterAndSortSpaces([], "", "newest").length, 0);
});
test("only owners and administrators may delete", () => {
  assert.equal(canDeleteSpace(spaces[0], "ROLE_USER"), true);
  assert.equal(canDeleteSpace(spaces[1], "ROLE_USER"), false);
  assert.equal(canDeleteSpace(spaces[2], "ROLE_USER"), false);
  assert.equal(
    canDeleteSpace({ currentUserRole: undefined }, "ROLE_USER"),
    false,
  );
  assert.equal(canDeleteSpace(spaces[2], "ROLE_ADMIN"), true);
});
