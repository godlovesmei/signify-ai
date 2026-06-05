import { describe, expect, it } from "vitest";
import { createSerializedQueue } from "@/lib/serializedQueue";

describe("serialized write queue", () => {
  it("TC-021 keeps writes ordered and continues after a failed task", async () => {
    const queue = createSerializedQueue();
    const events: string[] = [];

    const first = queue.enqueue(async () => {
      events.push("first:start");
      await Promise.resolve();
      events.push("first:end");
    });
    const failed = queue.enqueue(async () => {
      events.push("failed");
      throw new Error("expected");
    });
    const last = queue.enqueue(async () => {
      events.push("last");
    });

    await first;
    await expect(failed).rejects.toThrow("expected");
    await last;
    expect(events).toEqual(["first:start", "first:end", "failed", "last"]);
  });
});
