import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as navigation from "@/i18n/navigation";
import messages from "@/messages/en.json";
import { CONTRIBUTION, LABEL, POLICY } from "@/tests/datasetFixtures";
import ContributionRecorder from "./ContributionRecorder";
import { DatasetApiError } from "@/lib/dataset/api";
const mocks = vi.hoisted(() => ({ policy: vi.fn(), labels: vi.fn(), upload: vi.fn(), reviewInfo: vi.fn(), push: vi.fn() }));
const camera = vi.hoisted(() => ({
  videoRef: { current: null }, phase: "idle", countdown: 3, elapsed: 0,
  recording: null as null | { blob: Blob; url: string; durationMs: number; width: number; height: number },
  error: null, openCamera: vi.fn(), close: vi.fn(), start: vi.fn(), stop: vi.fn(),
  mirrored: false, setMirrored: vi.fn(),
}));
vi.mock("@/lib/dataset/api", async original => ({ ...await original<typeof import("@/lib/dataset/api")>(),
  datasetApi: { policy: mocks.policy, labels: mocks.labels, reviewInfo: mocks.reviewInfo }, uploadContribution: mocks.upload }));
vi.mock("@/hooks/useDatasetRecorder", () => ({ useDatasetRecorder: () => camera }));
function ui() { return <NextIntlClientProvider locale="en" messages={messages}><ContributionRecorder /></NextIntlClientProvider>; }
beforeEach(() => {
  mocks.push.mockReset();
  vi.spyOn(navigation, "useRouter").mockReturnValue({ ...navigation.useRouter(), push: mocks.push });
  window.history.replaceState({}, "", "/contributions/new");
  mocks.policy.mockReset().mockResolvedValue(POLICY); mocks.labels.mockReset().mockResolvedValue({ items: [LABEL] });
  mocks.upload.mockReset(); camera.phase = "idle"; camera.recording = null; camera.openCamera.mockClear();
  mocks.reviewInfo.mockReset().mockResolvedValue({ available: false, target_business_days: null, can_review: false });
  camera.mirrored = false; camera.setMirrored.mockClear();
  vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_VERSION", "synthetic-consent");
  vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_TEXT", "Synthetic consent for automated tests only.");
});
afterEach(() => vi.unstubAllEnvs());
function recorded(view: ReturnType<typeof render>) {
  camera.phase = "preview";
  camera.recording = { blob: new Blob(["video"], { type: "video/webm" }), url: "blob:synthetic",
    durationMs: 400, width: 64, height: 48 };
  view.rerender(ui());
}
describe("contribution recording form", () => {
  it("highlights only the active numbered step and waits for acknowledgement before navigating", async () => {
    const view = render(ui());
    fireEvent.change(await screen.findByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    const steps = screen.getByRole("list", { name: "Contribution steps" });
    const expectStep = (active: number) => {
      within(steps).getAllByRole("listitem", { hidden: true }).forEach((item, index) => {
        if (index === active) expect(item).toHaveAttribute("aria-current", "step");
        else expect(item).not.toHaveAttribute("aria-current");
        const badge = item.firstElementChild;
        expect(badge).toHaveTextContent(String(index + 1));
        if (index === active) expect(badge).toHaveClass("bg-cohere-primary");
        else expect(badge).toHaveClass("bg-cohere-stone");
      });
    };
    expectStep(0);
    expect(screen.queryByText("Review process and waiting time")).not.toBeInTheDocument();
    expect(screen.queryByText("Recording guide")).not.toBeInTheDocument();
    for (const phase of ["opening", "ready", "countdown", "recording"]) {
      camera.phase = phase; view.rerender(ui()); expectStep(1);
      expect(screen.queryByText("Recording guide")).not.toBeInTheDocument();
    }
    recorded(view); expectStep(2);
    let finishUpload!: (value: unknown) => void;
    mocks.upload.mockImplementation(() => new Promise(resolve => { finishUpload = resolve; }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit contribution" }));
    expectStep(3);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
    finishUpload({ contribution: CONTRIBUTION, replayed: false });
    const dialog = await screen.findByRole("dialog", { name: "Review process and waiting time" });
    expect(await within(dialog).findByText(/Human review is not enabled/)).toBeInTheDocument();
    expect(within(dialog).getByText(/The system checks technical suitability/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Check My Collection/)).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Okay" }));
    expect(mocks.push).toHaveBeenCalledWith("/contributions?submitted=" + encodeURIComponent(CONTRIBUTION.id));
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });
  it("omits the local pilot banner for local consent", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_VERSION", "dev-local-test");
    render(ui()); await screen.findByLabelText("Word to contribute");
    expect(screen.queryByText(/Local test: use synthetic videos/)).not.toBeInTheDocument();
  });
  it("shows the authoritative maximum size when the backend rejects a recorded video", async () => {
    const view = render(ui());
    fireEvent.change(await screen.findByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    recorded(view);
    mocks.upload.mockRejectedValue(new DatasetApiError(413, "video_too_large", { size_bytes: 17 * 1048576, max_size_bytes: 16 * 1048576 }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit contribution" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Video rejected: file too large");
    expect(screen.getByRole("alert")).toHaveTextContent("File size: 17 MiB");
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum file size: 16 MiB");
    expect(screen.getByRole("button", { name: "Record again" })).toBeEnabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("offers both orientations and updates the live preview without flipping playback again", async () => {
    const view = render(ui());
    await screen.findByLabelText("Word to contribute");
    expect(screen.getByRole("radio", { name: "No mirror" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Mirror" }));
    expect(camera.setMirrored).toHaveBeenCalledWith(true);
    camera.mirrored = true; view.rerender(ui());
    expect(screen.getByRole("radio", { name: "Mirror" })).toBeChecked();
    expect(screen.getByLabelText("Camera view", { selector: "video" })).toHaveStyle({ transform: "scaleX(-1)" });
    fireEvent.click(screen.getByRole("radio", { name: "No mirror" }));
    expect(camera.setMirrored).toHaveBeenLastCalledWith(false);
    recorded(view);
    expect(screen.getByLabelText("Recording preview").style.transform).toBe("");
  });
  it.each(["opening", "countdown", "recording", "preview"])("locks orientation during %s", async phase => {
    camera.phase = phase;
    render(ui()); await screen.findByLabelText("Word to contribute");
    expect(screen.getByRole("radio", { name: "No mirror" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Mirror" })).toBeDisabled();
  });
  it("blocks recording and upload when the policy has not been activated", async () => {
    mocks.policy.mockRejectedValue(new DatasetApiError(503, "video_policy_unavailable"));
    render(ui());
    expect(await screen.findByText("Recording configuration is not available")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    expect(screen.getByRole("button", { name: "Enable camera" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit contribution" })).toBeDisabled();
  });
  it("allows a free-word proposal with an empty catalog but refuses an empty word", async () => {
    mocks.labels.mockResolvedValue({ items: [] }); render(ui());
    await screen.findByText(/The contribution catalog is empty/);
    expect(screen.getByRole("button", { name: "Enable camera" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    expect(screen.getByRole("button", { name: "Enable camera" })).toBeEnabled();
    expect(screen.getByText(/not an official label/)).toBeInTheDocument();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("requires configured consent rather than making up a version", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_VERSION", "");
    render(ui()); await screen.findByLabelText("Word to contribute");
    expect(screen.getByText(/Approved consent wording/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit contribution" })).toBeDisabled();
  });
  it("retains identical free-word bytes, consent metadata, and key after an uncertain upload", async () => {
    const view = render(ui());
    fireEvent.change(await screen.findByLabelText("Word to contribute"), { target: { value: " Synthetic proposal " } });
    recorded(view);
    fireEvent.click(screen.getByRole("checkbox"));
    mocks.upload.mockRejectedValueOnce(new DatasetApiError(503, "upload_commit_unknown"))
      .mockResolvedValueOnce({ contribution: CONTRIBUTION, replayed: true });
    fireEvent.click(screen.getByRole("button", { name: "Submit contribution" }));
    await screen.findByText(/The outcome is not confirmed/);
    expect(screen.getByRole("button", { name: "Record again" })).toBeDisabled();
    expect(screen.getByLabelText("Word to contribute")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry the same upload" }));
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(2));
    const [first, second] = mocks.upload.mock.calls;
    expect(first.slice(0, 3)).toEqual(second.slice(0, 3));
    expect(first[1]).toEqual({ proposed_label_text: "Synthetic proposal", consent: true, consent_version: "synthetic-consent" });
    expect(first[1]).not.toHaveProperty("user_id");
  });
  it("uses the catalog ID for an existing word and requires consent before sending", async () => {
    const view = render(ui());
    fireEvent.change(await screen.findByLabelText("Word to contribute"), { target: { value: LABEL.display_name.toUpperCase() } });
    recorded(view);
    expect(screen.getByRole("button", { name: "Submit contribution" })).toBeDisabled();
    mocks.upload.mockResolvedValue({ contribution: CONTRIBUTION, replayed: false });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit contribution" }));
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
    expect(mocks.upload.mock.calls[0][1]).toEqual({ proposed_label_id: LABEL.id, consent: true, consent_version: "synthetic-consent" });
  });
  it("keeps named alphabet references separate from the proposed word", async () => {
    render(ui());
    fireEvent.change(await screen.findByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    expect(screen.getByRole("img", { name: "Alphabet A" })).toBeInTheDocument();
    expect(screen.getByText(/does not demonstrate the sign for your proposed word/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Synthetic proposal" })).not.toBeInTheDocument();
  });
  it("stops recording access if the catalog service fails", async () => {
    mocks.labels.mockRejectedValue(new DatasetApiError(503, "upstream_unavailable"));
    render(ui()); await screen.findByRole("alert");
    fireEvent.change(screen.getByLabelText("Word to contribute"), { target: { value: "Synthetic proposal" } });
    expect(screen.getByRole("button", { name: "Enable camera" })).toBeDisabled();
  });
});
