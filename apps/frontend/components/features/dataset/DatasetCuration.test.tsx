import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { CONTRIBUTION, LABEL } from "@/tests/datasetFixtures";
import { DatasetApiError } from "@/lib/dataset/api";
import DatasetCuration from "./DatasetCuration";
const api = vi.hoisted(() => ({ reviewQueue: vi.fn(), review: vi.fn(), labels: vi.fn(), playback: vi.fn(), reviewSummary: vi.fn() }));
const live = vi.hoisted(() => ({ refresh: null as null | (() => void) }));
vi.mock('@/hooks/useDatasetLiveUpdates', () => ({ useDatasetLiveUpdates: (refresh: () => void) => { live.refresh = refresh; } }));
vi.mock("@/lib/dataset/api", async original => ({ ...await original<typeof import("@/lib/dataset/api")>(), datasetApi: api }));
const ui = () => <NextIntlClientProvider locale="en" messages={messages}><DatasetCuration /></NextIntlClientProvider>;
beforeEach(() => {
  api.reviewQueue.mockReset().mockResolvedValue({ items: [CONTRIBUTION], next_offset: null, total: 1 });
  api.reviewSummary.mockReset().mockResolvedValue({ total: 17, PENDING: 10, APPROVED: 5, REJECTED: 2 });
  api.labels.mockReset().mockResolvedValue({ items: [LABEL] });
  api.review.mockReset().mockResolvedValue({ revision: 2, status: "REJECTED" });
  api.playback.mockReset().mockImplementation(() => new Promise(() => {}));
});
async function inspect() {
  fireEvent.click(await screen.findByRole("button", { name: "Inspect contribution " + LABEL.display_name }));
  return screen.findByRole("dialog");
}
describe("curator decisions", () => {
  it('updates an empty queue and summary when another account submits', async () => {
    api.reviewQueue.mockResolvedValue({ items: [], next_offset: null, total: 0 });
    api.reviewSummary.mockResolvedValue({ total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
    render(ui());
    await screen.findByText('No videos are pending review on this page.');
    api.reviewQueue.mockResolvedValue({ items: [CONTRIBUTION], next_offset: null, total: 1 });
    api.reviewSummary.mockResolvedValue({ total: 1, PENDING: 1, APPROVED: 0, REJECTED: 0 });
    await act(async () => live.refresh?.());
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspect contribution ' + LABEL.display_name })).toBeInTheDocument();
  });
  it('keeps the video dialog, draft notes and inspected revision when the queue changes', async () => {
    render(ui()); const dialog = await inspect();
    fireEvent.change(within(dialog).getByLabelText('Curation notes / rejection reason'), { target: { value: 'Draft review in progress' } });
    api.reviewQueue.mockResolvedValue({ items: [{ ...CONTRIBUTION, id: 'new-arrival', proposed_label_text: 'New arrival' }], next_offset: 10, total: 11 });
    api.reviewSummary.mockResolvedValue({ total: 18, PENDING: 11, APPROVED: 5, REJECTED: 2 });
    await act(async () => live.refresh?.());
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).getByLabelText('Curation notes / rejection reason')).toHaveValue('Draft review in progress');
    expect(api.playback).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(CONTRIBUTION.id, expect.objectContaining({ expected_revision: CONTRIBUTION.revision }), expect.any(AbortSignal)));
  });
  it('allows viewing previously reviewed videos without offering another decision', async () => {
    render(ui()); await screen.findByRole('table');
    api.reviewQueue.mockResolvedValue({ items: [{ ...CONTRIBUTION, status: 'APPROVED' }], next_offset: null, total: 1 });
    fireEvent.change(screen.getByLabelText('Filter contribution status'), { target: { value: 'ALL' } });
    await waitFor(() => expect(api.reviewQueue).toHaveBeenLastCalledWith(0, expect.any(AbortSignal), '', 'ALL'));
    const dialog = await inspect();
    expect(within(dialog).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(api.playback).toHaveBeenCalledWith(CONTRIBUTION.id, expect.any(AbortSignal));
  });
  it("shows real global counts and opens private playback only after Inspect", async () => {
    render(ui()); await screen.findByRole("table");
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(api.playback).not.toHaveBeenCalled();
    const dialog = await inspect();
    expect(within(dialog).getByText("Passed")).toBeInTheDocument();
    expect(api.playback).toHaveBeenCalledWith(CONTRIBUTION.id, expect.any(AbortSignal));
  });
  it("blocks blank rejection reasons and sends the contributor-facing explanation", async () => {
    render(ui()); const dialog = await inspect();
    const reason = within(dialog).getByLabelText("Curation notes / rejection reason");
    expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDisabled();
    fireEvent.change(reason, { target: { value: " \n " } });
    expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDisabled();
    fireEvent.change(reason, { target: { value: " Keep both hands inside the frame. " } });
    api.reviewQueue.mockResolvedValue({ items: [], next_offset: null, total: 0 });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(CONTRIBUTION.id,
      { expected_revision: CONTRIBUTION.revision, decision: "REJECTED", reason: "Keep both hands inside the frame." }, expect.any(AbortSignal)));
    expect(await screen.findByText(/Review decision saved/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("requires an explicit final label for approval", async () => {
    render(ui()); const dialog = await inspect();
    expect(within(dialog).getByRole("button", { name: "Approve" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Final label"), { target: { value: LABEL.id } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(CONTRIBUTION.id,
      { expected_revision: CONTRIBUTION.revision, decision: "APPROVED", final_label_id: LABEL.id }, expect.any(AbortSignal)));
  });
  it("allows explicit new-word approval without requiring a pre-existing catalog label", async () => {
    api.reviewQueue.mockResolvedValue({ items: [{ ...CONTRIBUTION, proposed_label_text: "New word" }], next_offset: null, total: 1 });
    api.labels.mockResolvedValue({ items: [] });
    render(ui()); fireEvent.click(await screen.findByRole("button", { name: "Inspect contribution New word" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Final label"), { target: { value: "__new__" } });
    expect(within(dialog).getByLabelText("Word for the final label")).toHaveValue("New word");
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(api.review).toHaveBeenCalledWith(CONTRIBUTION.id,
      { expected_revision: CONTRIBUTION.revision, decision: "APPROVED", final_label_text: "New word" }, expect.any(AbortSignal)));
  });
  it.each([409, 503])("locks decisions after HTTP %i until refreshing the queue", async status => {
    api.review.mockRejectedValue(new DatasetApiError(status, "synthetic_failure"));
    render(ui()); const dialog = await inspect();
    fireEvent.change(within(dialog).getByLabelText("Curation notes / rejection reason"), { target: { value: "Gesture was cut off." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    expect(await within(dialog).findByText(/The decision outcome is uncertain/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Reject" })).toBeDisabled();
    expect(api.review).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Refresh queue" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.review).toHaveBeenCalledTimes(1);
  });
  it("does not expose review controls when the queue API refuses access", async () => {
    api.reviewQueue.mockRejectedValue(new DatasetApiError(403, "operation_forbidden"));
    render(ui()); expect(await screen.findByRole("alert")).toHaveTextContent("permission");
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});
