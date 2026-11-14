import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { CONTRIBUTION, ID, LABEL } from "@/tests/datasetFixtures";
import ContributionsContent from "@/app/[locale]/(workspace)/contributions/_content";
import ContributionDetailContent from "@/app/[locale]/(workspace)/contributions/[id]/_content";
import { DatasetApiError } from "@/lib/dataset/api";
const api = vi.hoisted(() => ({ list: vi.fn(), summary: vi.fn(), detail: vi.fn(), labels: vi.fn(), playback: vi.fn(), reviewInfo: vi.fn() }));
vi.mock("@/lib/dataset/api", async original => ({ ...await original<typeof import("@/lib/dataset/api")>(), datasetApi: api }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: ID }) }));
function ui(child: React.ReactNode) {
  return <NextIntlClientProvider locale="en" messages={messages}>{child}</NextIntlClientProvider>;
}
beforeEach(() => {
  window.history.replaceState({}, "", "/contributions");
  api.list.mockReset().mockResolvedValue({ items: [CONTRIBUTION], next_offset: null, total: 1 });
  api.summary.mockReset().mockResolvedValue({ total: 17, PENDING: 10, APPROVED: 5, REJECTED: 2 });
  api.detail.mockReset().mockResolvedValue(CONTRIBUTION);
  api.labels.mockReset().mockResolvedValue({ items: [LABEL] });
  api.playback.mockReset();
  api.reviewInfo.mockReset().mockResolvedValue({ available: false, target_business_days: null, can_review: false });
});
describe("contribution collection", () => {
  it("shows the curator's explanation in the collection and offers a corrected recording", async () => {
    api.list.mockResolvedValue({ items: [{ ...CONTRIBUTION, status: "REJECTED", proposed_label_text: "Synthetic proposal",
      rejection_reason: "Keep both hands visible.\nUse a brighter background." }], next_offset: null, total: 1 });
    render(ui(<ContributionsContent />));
    expect(await screen.findByText(/Keep both hands visible/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Synthetic test label" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Use a brighter background/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Record a corrected video" })).toHaveAttribute("href", "/contributions/new?word=Synthetic%20proposal");
  });
  it("omits the refresh button and collection loading note", async () => {
    render(ui(<ContributionsContent />)); await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: "Refresh results" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Newest submissions appear first/)).not.toBeInTheDocument();
    expect(screen.queryByText(/contributions on this page/)).not.toBeInTheDocument();
    expect(screen.getByText("Showing Page 1 of 1")).toBeInTheDocument();
  });
  it("renders real global counts and requests ten contributions per page", async () => {
    const rows = Array.from({ length: 17 }, (_, index) => ({ ...CONTRIBUTION, id: String(index) }));
    api.list.mockResolvedValueOnce({ items: rows.slice(0, 10), next_offset: 10, total: 17 })
      .mockResolvedValueOnce({ items: rows.slice(10), next_offset: null, total: 17 });
    render(ui(<ContributionsContent />));
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("Showing Page 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(10, expect.any(AbortSignal), { q: "", status: undefined }));
    expect(await screen.findByText("Showing Page 2 of 2")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
  it("sends word and status filters to the API instead of filtering only one page", async () => {
    api.list.mockResolvedValueOnce({ items: [CONTRIBUTION], next_offset: 10, total: 17 })
      .mockResolvedValue({ items: [CONTRIBUTION], next_offset: null, total: 1 });
    render(ui(<ContributionsContent />)); await screen.findByRole("table");
    expect(screen.getByText("Showing Page 1 of 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search contributed words"), { target: { value: "Synthetic proposal" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(0, expect.any(AbortSignal), { q: "Synthetic proposal", status: undefined }));
    expect(await screen.findByText("Showing Page 1 of 1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filter contribution status"), { target: { value: "PENDING" } });
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(0, expect.any(AbortSignal), { q: "Synthetic proposal", status: "PENDING" }));
  });
  it("handles empty collections", async () => {
    api.list.mockResolvedValue({ items: [], next_offset: null, total: 0 });
    render(ui(<ContributionsContent />));
    expect(await screen.findByText("Your collection starts here")).toBeInTheDocument();
  });
  it.each([401, 403, 503])("shows an accessible collection error for HTTP %i", async status => {
    api.list.mockRejectedValue(new DatasetApiError(status, "synthetic_failure"));
    render(ui(<ContributionsContent />));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Synthetic test label")).not.toBeInTheDocument();
  });
  it("confirms sending only when the returned owner collection contains the submitted ID", async () => {
    window.history.replaceState({}, "", "/contributions?submitted=" + ID);
    render(ui(<ContributionsContent />));
    expect(await screen.findByText("Contribution sent successfully")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Pending review")).toBeInTheDocument();
  });
  it("does not show a success banner for an arbitrary submitted ID", async () => {
    window.history.replaceState({}, "", "/contributions?submitted=unowned-id");
    render(ui(<ContributionsContent />)); await screen.findByRole("table");
    expect(screen.queryByText("Contribution sent successfully")).not.toBeInTheDocument();
  });
  it("opens private playback only after an explicit click, then aborts it when closed", async () => {
    let accessSignal: AbortSignal | undefined;
    api.playback.mockImplementation((_id, signal) => { accessSignal = signal; return new Promise(() => {}); });
    render(ui(<ContributionsContent />)); await screen.findByRole("table");
    expect(api.playback).not.toHaveBeenCalled();
    const play = screen.getByRole("button", { name: "Play contribution Synthetic test label" });
    fireEvent.click(play);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await waitFor(() => expect(api.playback).toHaveBeenCalledWith(ID, expect.any(AbortSignal)));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(accessSignal?.aborted).toBe(true));
  });
  it("renders technical metadata and does not prefetch signed video URLs on the old detail route", async () => {
    render(ui(<ContributionDetailContent />));
    expect(await screen.findByText(CONTRIBUTION.source_sha256!)).toBeInTheDocument();
    expect(screen.getByText("vp8")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load private video" })).toBeInTheDocument();
    expect(api.playback).not.toHaveBeenCalled();
  });
  it("does not render private playback when a contribution is absent or not owned", async () => {
    api.detail.mockRejectedValue(new DatasetApiError(404, "contribution_not_found"));
    render(ui(<ContributionDetailContent />));
    expect(await screen.findByRole("alert")).toHaveTextContent(/belongs to another account/);
    expect(screen.queryByRole("button", { name: "Load private video" })).not.toBeInTheDocument();
    expect(api.playback).not.toHaveBeenCalled();
  });
});
