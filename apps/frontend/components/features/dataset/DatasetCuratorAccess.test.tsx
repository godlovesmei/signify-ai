import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import DatasetCuratorAccess from "./DatasetCuratorAccess";
const api = vi.hoisted(() => ({ curators: vi.fn(), grantCurator: vi.fn(), revokeCurator: vi.fn() }));
vi.mock("@/lib/dataset/api", async original => ({ ...await original<typeof import("@/lib/dataset/api")>(), datasetApi: api }));
const account = { user_id: "synthetic-user", email: "curator@example.test", display_name: "Test curator", qualification_note: "Sign language reviewer", granted_at: "2026-11-11T01:00:00Z", revoked_at: null };
function show() { render(<NextIntlClientProvider locale="en" messages={messages}><DatasetCuratorAccess /></NextIntlClientProvider>); }
beforeEach(() => {
  api.curators.mockReset().mockResolvedValue({ items: [] });
  api.grantCurator.mockReset().mockResolvedValue({ user_id: account.user_id, active: true });
  api.revokeCurator.mockReset().mockResolvedValue({ user_id: account.user_id, active: false });
});
describe("admin curator access", () => {
  it("requires a registered account email and a competence note", async () => {
    show(); await screen.findByText(/No curator accounts yet/);
    const submit = screen.getByRole("button", { name: "Grant curator access" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Curator account email"), { target: { value: "curator@example.test" } });
    fireEvent.change(screen.getByLabelText("Competence / assignment note"), { target: { value: "  Sign language reviewer  " } });
    api.curators.mockResolvedValue({ items: [account] });
    fireEvent.click(submit);
    await waitFor(() => expect(api.grantCurator).toHaveBeenCalledWith(account.email, account.qualification_note, expect.any(AbortSignal)));
    expect(await screen.findByText("Test curator")).toBeInTheDocument();
  });
  it("confirms revocation and includes the assignment timestamp against stale changes", async () => {
    api.curators.mockResolvedValue({ items: [account] }); show(); await screen.findByText("Test curator");
    fireEvent.click(screen.getByRole("button", { name: "Revoke access" }));
    const dialog = await screen.findByRole("dialog");
    expect(api.revokeCurator).not.toHaveBeenCalled();
    api.curators.mockResolvedValue({ items: [{ ...account, revoked_at: "2026-11-11T02:00:00Z" }] });
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke access" }));
    await waitFor(() => expect(api.revokeCurator).toHaveBeenCalledWith(account.user_id, account.granted_at, expect.any(AbortSignal)));
    expect(await screen.findByText("Revoked")).toBeInTheDocument();
  });
});
