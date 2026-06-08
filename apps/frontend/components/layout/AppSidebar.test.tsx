import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppSidebar from "./AppSidebar";

const SIDEBAR_USER = {
  name: "Meiske Priskilla Sahertian",
  email: "meiskesahertian7@gmail.com",
  avatarUrl: null,
};

function renderSidebar(pathname = "/translate") {
  return render(
    <AppSidebar
      pathname={pathname}
      onSettingsClick={vi.fn()}
      onLogout={vi.fn()}
      user={SIDEBAR_USER}
    />
  );
}

describe("AppSidebar", () => {
  it("keeps the desktop nav order stable and marks the active workspace page", () => {
    renderSidebar("/translate");

    const nav = screen.getByRole("navigation", {
      name: "Workspace navigation",
    });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Translate",
      "Practice",
      "History",
      "Reference",
    ]);
    expect(within(nav).queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();

    const translateLink = within(nav).getByRole("link", { name: "Translate" });
    expect(translateLink).toHaveAttribute("aria-current", "page");
    expect(translateLink.querySelector(".bg-cohere-primary")).toHaveClass("z-0");
    expect(translateLink.querySelector(".bg-cohere-primary")).not.toHaveClass("-z-10");
  });

  it("uses the account row as the profile navigation target on desktop", () => {
    renderSidebar("/profile");

    const nav = screen.getByRole("navigation", {
      name: "Workspace navigation",
    });

    expect(within(nav).queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Meiske Priskilla Sahertian/i })
    ).toHaveAttribute("aria-current", "page");
  });
});
