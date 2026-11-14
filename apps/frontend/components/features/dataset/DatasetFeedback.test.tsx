import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import { DatasetApiError } from "@/lib/dataset/api";
import { CONTRIBUTION, POLICY } from "@/tests/datasetFixtures";
import { validateRecording } from "@/lib/dataset/recorder";
import { ContributionReviewFeedback, DatasetErrorNotice } from "./DatasetFeedback";
const ui = (child: React.ReactNode) => <NextIntlClientProvider locale="en" messages={messages}>{child}</NextIntlClientProvider>;

describe("video size and review explanations", () => {
  it("distinguishes empty files from files above the maximum without imposing a KB minimum", () => {
    expect(validateRecording(new Blob([], { type: "video/webm" }), 400, 64, 48, POLICY)).toBe("emptyVideo");
    expect(validateRecording(new Blob(["x"], { type: "video/webm" }), 400, 64, 48, POLICY)).toBeNull();
    expect(validateRecording(new Blob([new Uint8Array(POLICY.max_size_bytes + 1)], { type: "video/webm" }), 400, 64, 48, POLICY)).toBe("tooLarge");
  });
  it("shows a separate empty-video notice and the zero-byte size", () => {
    render(ui(<DatasetErrorNotice error={new DatasetApiError(422, "empty_video", { size_bytes: 0, max_size_bytes: 16 * 1048576 })} />));
    expect(screen.getByRole("alert")).toHaveTextContent("Video rejected: empty file");
    expect(screen.getByRole("alert")).toHaveTextContent("File size: 0 B");
    expect(screen.getByRole("alert")).not.toHaveTextContent("file too large");
  });
  it("uses the known policy limit when a multipart rejection has no file size", () => {
    render(ui(<DatasetErrorNotice error={new DatasetApiError(413, "request_too_large")} maxSizeBytes={16 * 1048576} />));
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum file size: 16 MiB");
    expect(screen.getByRole("alert")).not.toHaveTextContent("File size:");
  });
  it("does not invent an explanation when an older rejected row lacks one", () => {
    render(ui(<ContributionReviewFeedback contribution={{ ...CONTRIBUTION, status: "REJECTED", rejection_reason: "  " }} />));
    expect(screen.getByText(/Contact the operator/)).toBeInTheDocument();
  });
});
