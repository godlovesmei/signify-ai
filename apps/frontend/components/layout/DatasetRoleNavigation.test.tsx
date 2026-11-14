import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import DatasetRoleNavigation from "./DatasetRoleNavigation";
function show(admin: boolean, curator: boolean) {
  render(<NextIntlClientProvider locale="en" messages={messages}><DatasetRoleNavigation pathname="/curator" access={{ is_admin: admin, is_curator: curator, review_available: curator }} /></NextIntlClientProvider>);
}
describe("role navigation", () => {
  it("shows no privileged links for a regular account", () => {
    show(false, false); expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
  it("shows the curator panel without admin access management", () => {
    show(false, true);
    expect(screen.getByRole("link", { name: "Video curation panel" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Curator access" })).not.toBeInTheDocument();
  });
  it("does not expose account management for administrators", () => {
    show(true, false);
    expect(screen.queryByRole("link", { name: "Curator access" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Video curation panel" })).not.toBeInTheDocument();
  });
});
