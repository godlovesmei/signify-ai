import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { DevelopmentLogin } from "./DevelopmentLogin";
const signIn = vi.hoisted(() => vi.fn());
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { signInWithPassword: signIn } }) }));
function ui() { return <NextIntlClientProvider locale="en" messages={messages}><DevelopmentLogin /></NextIntlClientProvider>; }
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
  vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", "http://127.0.0.1:8001");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431"); signIn.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("development password sign-in", () => {
  it("uses existing Supabase Auth and displays safe credential errors", async () => {
    signIn.mockResolvedValue({ error: new Error("upstream details") }); render(ui());
    fireEvent.change(screen.getByLabelText("Local account email"), { target: { value: "synthetic@example.test" } });
    fireEvent.change(screen.getByLabelText("Local account password"), { target: { value: "synthetic-test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in locally" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-in failed");
    expect(signIn).toHaveBeenCalledWith({ email: "synthetic@example.test", password: "synthetic-test-password" });
    expect(screen.getByRole("alert")).not.toHaveTextContent("upstream details");
  });
  it("is absent in production even if the local flag is set", () => {
    vi.stubEnv("NODE_ENV", "production"); render(ui());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
