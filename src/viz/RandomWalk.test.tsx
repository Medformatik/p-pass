import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RandomWalk } from "./RandomWalk";

describe("RandomWalk", () => {
  it("renders a canvas with role=img", () => {
    const { container } = render(<RandomWalk dimension={1} steps={100} />);
    expect(container.querySelector("canvas[role='img']")).not.toBeNull();
  });
});
