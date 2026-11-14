import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import DatasetReviewNotice from "./DatasetReviewNotice";
const { reviewInfo } = vi.hoisted(() => ({ reviewInfo: vi.fn() }));
vi.mock("@/lib/dataset/api", () => ({ datasetApi: { reviewInfo } }));
const ui = () => <NextIntlClientProvider locale="en" messages={messages}><DatasetReviewNotice /></NextIntlClientProvider>;
beforeEach(() => { reviewInfo.mockReset(); });
describe("conditional review timing", () => {
  it("does not publish the internal three-day target while curator readiness is unconfirmed", async () => {
    reviewInfo.mockResolvedValue({ available: false, target_business_days: null, can_review: false });
    render(ui());
    expect(await screen.findByText(/Human review is not enabled/)).toBeInTheDocument();
    expect(screen.queryByText(/3 business days/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Video curation" })).not.toBeInTheDocument();
  });
  it("labels an enabled target as an estimate rather than a completion promise", async () => {
    reviewInfo.mockResolvedValue({ available: true, target_business_days: 3, can_review: true });
    render(ui());
    expect(await screen.findByText(/around 3 business days/)).toHaveTextContent("not a completion promise");
    expect(screen.getByRole("link", { name: "Video curation" })).toHaveAttribute("href", "/curator");
  });
  it("shows unavailable timing honestly when the service fails", async () => {
    reviewInfo.mockRejectedValue(new Error("synthetic"));
    render(ui());
    expect(await screen.findByText(/Review timing information is unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/3 business days/)).not.toBeInTheDocument();
  });
});
