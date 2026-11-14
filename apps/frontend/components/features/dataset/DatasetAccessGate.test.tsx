import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import DatasetAccessGate from "./DatasetAccessGate";
const access = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dataset/api", async original => ({ ...await original<typeof import("@/lib/dataset/api")>(), datasetApi: { access } }));
beforeEach(() => access.mockReset());
function show(role: "curator" | "admin") {
  render(<NextIntlClientProvider locale="en" messages={messages}><DatasetAccessGate role={role}><p>Protected controls</p></DatasetAccessGate></NextIntlClientProvider>);
}
describe("dataset role gate", () => {
  it.each([
    ["curator", { is_admin: true, is_curator: false, review_available: true }],
    ["admin", { is_admin: false, is_curator: true, review_available: true }],
    ["curator", { is_admin: false, is_curator: false, review_available: false }],
  ] as const)("denies %s controls to an unauthorized account", async (role, value) => {
    access.mockResolvedValue(value); show(role);
    expect(await screen.findByText("Restricted access")).toBeInTheDocument();
    expect(screen.queryByText("Protected controls")).not.toBeInTheDocument();
  });
  it("waits for authoritative permission before rendering the curator page", async () => {
    access.mockResolvedValue({ is_admin: false, is_curator: true, review_available: true }); show("curator");
    expect(screen.queryByText("Protected controls")).not.toBeInTheDocument();
    expect(await screen.findByText("Protected controls")).toBeInTheDocument();
  });
});
