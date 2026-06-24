import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import WebcamCapture from "@/components/features/translation/WebcamCapture";
import messages from "@/messages/en.json";

function renderCamera({ isMirrored = false }: { isMirrored?: boolean } = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WebcamCapture
        state="detecting"
        isMirrored={isMirrored}
        detections={[
          {
            class: "B",
            confidence: 0.875,
            box: { x1: 64, y1: 80, x2: 320, y2: 400 },
          },
        ]}
        apiError={false}
        hasMultipleCameras
        onRequestCamera={vi.fn()}
        onStartDetection={vi.fn()}
        onStopDetection={vi.fn()}
        onFlipCamera={vi.fn()}
        onReset={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

describe("WebcamCapture", () => {
  it("TC-011 UAT-005 renders detection bounding boxes on the camera overlay", () => {
    renderCamera();

    expect(screen.getByText("Gesture detected")).toBeInTheDocument();
    const box = document.querySelector("[data-detection-box]");

    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute("aria-label", "B 88%");
    expect(box).toHaveStyle({
      left: "10%",
      top: "12.5%",
      width: "40%",
      height: "50%",
    });
  });

  it("TC-011 UAT-005 mirrors detection boxes with the front-facing camera preview", () => {
    renderCamera({ isMirrored: true });

    expect(document.querySelector("[data-detection-box]")).toHaveStyle({
      left: "50%",
    });
  });
});
