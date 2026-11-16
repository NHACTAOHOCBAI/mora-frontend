import test from "node:test";
import assert from "node:assert/strict";
import {
  canGroupMessages,
  getMessageKind,
} from "../src/features/chat/utils/message-grouping.ts";

const message = (overrides = {}) => ({
  id: 1,
  sender: "user",
  userId: 2,
  messageType: "USER_MESSAGE",
  text: "Hello",
  timestamp: "2026-11-16T10:00:00+07:00",
  ...overrides,
});

test("groups consecutive messages through the five-minute boundary", () => {
  assert.equal(
    canGroupMessages(
      message(),
      message({ timestamp: "2026-11-16T10:05:00+07:00" }),
      3,
    ),
    true,
  );
  assert.equal(
    canGroupMessages(
      message(),
      message({ timestamp: "2026-11-16T10:05:01+07:00" }),
      3,
    ),
    false,
  );
});

test("splits different senders, message types, unknown users and AI answers", () => {
  for (const overrides of [
    { userId: 3 },
    { messageType: "AI_QUERY" },
    { userId: undefined },
    { sender: "assistant" },
  ]) {
    assert.equal(canGroupMessages(message(), message(overrides), 3), false);
  }
  assert.equal(
    canGroupMessages(
      message({ userId: undefined }),
      message({ userId: undefined }),
      3,
    ),
    false,
  );
  assert.equal(canGroupMessages(undefined, message(), 3), false);
  assert.equal(canGroupMessages(message(), undefined, 3), false);
  assert.equal(
    canGroupMessages(
      message({ sender: "assistant" }),
      message({ sender: "assistant" }),
      3,
    ),
    false,
  );
});

test("splits at midnight and rejects invalid or reversed timestamps", () => {
  assert.equal(
    canGroupMessages(
      message({ timestamp: new Date(2026, 10, 16, 23, 59) }),
      message({ timestamp: new Date(2026, 10, 17, 0, 0) }),
      3,
    ),
    false,
  );
  assert.equal(
    canGroupMessages(message(), message({ timestamp: "invalid" }), 3),
    false,
  );
  assert.equal(
    canGroupMessages(
      message(),
      message({ timestamp: "2026-11-16T09:59:00+07:00" }),
      3,
    ),
    false,
  );
});

test("uses explicit types and correctly classifies legacy AI mentions", () => {
  assert.equal(
    getMessageKind(message({ sender: "assistant" }), 1),
    "AI_RESPONSE",
  );
  assert.equal(getMessageKind(message(), 1), "USER_MESSAGE");
  assert.equal(
    getMessageKind(message({ messageType: undefined }), 1),
    "AI_QUERY",
  );
  assert.equal(
    getMessageKind(message({ messageType: undefined, text: "@Mora help" }), 3),
    "AI_QUERY",
  );
  assert.equal(
    getMessageKind(
      message({ messageType: undefined, text: "@moral hello" }),
      3,
    ),
    "USER_MESSAGE",
  );
});
