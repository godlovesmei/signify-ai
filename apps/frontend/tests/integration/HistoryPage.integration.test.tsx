import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HistoryPageContent from "@/app/(workspace)/history/_content";
import { getHistorySessions } from "@/lib/userData";

vi.mock("@/lib/userData", () => ({
  clearHistoryEntries: vi.fn(),
  getHistorySessions: vi.fn(),
  removeHistorySession: vi.fn(),
}));

describe("HistoryPageContent", () => {
  beforeEach(() => {
    vi.mocked(getHistorySessions).mockReset();
  });

  it("TC-014 renders an error state, retries, then renders the empty state", async () => {
    vi.mocked(getHistorySessions)
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce({ sessions: [], hasMore: false });

    render(<HistoryPageContent />);

    expect(
      await screen.findByText("History is temporarily unavailable."),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("No history yet")).toBeVisible();
    expect(getHistorySessions).toHaveBeenCalledTimes(2);
  });
});
