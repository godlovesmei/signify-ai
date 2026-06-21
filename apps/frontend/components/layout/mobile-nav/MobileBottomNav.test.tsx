import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import MobileBottomNav from "./MobileBottomNav";
import messages from "@/messages/id.json";

function renderMobileBottomNav(onSettingsClick = vi.fn()) {
  window.history.pushState({}, "", "/translate");

  render(
    <NextIntlClientProvider locale="id" messages={messages}>
      <MobileBottomNav
        reserveSpace={false}
        onSettingsClick={onSettingsClick}
      />
    </NextIntlClientProvider>
  );

  return onSettingsClick;
}

describe("MobileBottomNav", () => {
  it("shows Settings as a mobile/tablet dialog action", () => {
    renderMobileBottomNav();

    const settingsButton = screen.getByRole("button", { name: "Pengaturan" });

    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("link", { name: "Profil" })).toHaveAttribute(
      "href",
      "/profile"
    );
  });

  it("opens Settings through the provided action handler", () => {
    const onSettingsClick = renderMobileBottomNav();

    fireEvent.click(screen.getByRole("button", { name: "Pengaturan" }));

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });
});
