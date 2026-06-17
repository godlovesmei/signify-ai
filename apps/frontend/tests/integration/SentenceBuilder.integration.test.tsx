import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import SentenceBuilder from "@/components/features/translation/SentenceBuilder";
import messages from "@/messages/en.json";

function renderBuilder(tokens: string[] = []) {
  const actions = {
    onDeleteLast: vi.fn(),
    onClearAll: vi.fn(),
    onSpeak: vi.fn(),
    onAddSpace: vi.fn(),
  };
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SentenceBuilder tokens={tokens} isSpeaking={false} {...actions} />
    </NextIntlClientProvider>,
  );
  return actions;
}

describe("SentenceBuilder", () => {
  it("TC-010 exposes empty state and disables unavailable actions", () => {
    renderBuilder();
    expect(screen.getByText("Result appears here...")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Delete last letter" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speak sentence" })).toBeDisabled();
  });

  it("TC-010 invokes edit, clear-confirmation, spacing, and TTS controls", async () => {
    const actions = renderBuilder(["A", "B"]);

    await userEvent.click(screen.getByRole("button", { name: "Add space" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Delete last letter" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear sentence" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Confirm clear sentence" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Speak sentence" }));

    expect(actions.onAddSpace).toHaveBeenCalledOnce();
    expect(actions.onDeleteLast).toHaveBeenCalledOnce();
    expect(actions.onClearAll).toHaveBeenCalledOnce();
    expect(actions.onSpeak).toHaveBeenCalledOnce();
  });

  it("TC-024 renders XSS-prone transcript text without executing markup", () => {
    const payload = '<img src=x onerror="alert(1)">';
    renderBuilder([payload]);

    expect(screen.getAllByText(payload)).toHaveLength(2);
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });
});
