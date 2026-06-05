import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginModal } from "@/components/auth/LoginModal";

const signInWithOAuth = vi.fn();

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOAuth },
  }),
}));

describe("LoginModal", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("TC-002 starts Google OAuth with a safe return destination", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<LoginModal open onClose={vi.fn()} nextPath="/history?page=2" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: expect.objectContaining({
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Fhistory%3Fpage%3D2",
      }),
    });
  });

  it("TC-001 displays an accessible error when OAuth initialization fails", async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error("failed") });
    render(<LoginModal open onClose={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign-in failed. Please try again.",
    );
  });

  it("TC-025 closes with Escape and initially focuses a dialog control", async () => {
    const onClose = vi.fn();
    render(<LoginModal open onClose={onClose} />);

    expect(screen.getByRole("button", { name: "Close sign in" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
