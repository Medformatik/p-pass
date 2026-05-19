import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Regression } from "./Regression";

describe("Regression", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<Regression points={[[0, 0], [1, 1], [2, 2]]} />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
