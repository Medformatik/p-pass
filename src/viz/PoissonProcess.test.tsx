import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PoissonProcess } from "./PoissonProcess";

describe("PoissonProcess", () => {
  it("renders a canvas with role=img", () => {
    const { container } = render(<PoissonProcess lambda={2} />);
    expect(container.querySelector("canvas[role='img']")).not.toBeNull();
  });
});
