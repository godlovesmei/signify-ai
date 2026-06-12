import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AutoAvatar } from "@/components/ui/AutoAvatar";

describe("AutoAvatar", () => {
  it("uses the automatic initial when Google OAuth has no picture", () => {
    const { container } = render(
      <AutoAvatar
        name="Meiske Priskilla Sahertian"
        email="meiske@example.test"
        avatarUrl={null}
        className="size-10"
      />
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("renders the OAuth image first and falls back to the automatic initial on load error", () => {
    const { container } = render(
      <AutoAvatar
        name="Meiske Priskilla Sahertian"
        email="meiske@example.test"
        avatarUrl="https://lh3.googleusercontent.com/google-avatar.png"
        className="size-10"
      />
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/google-avatar.png"
    );

    fireEvent.error(image as HTMLImageElement);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });
});
