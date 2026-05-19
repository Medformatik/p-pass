import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LorenzGini } from "./LorenzGini";

describe("LorenzGini", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<LorenzGini values={[1, 2, 3, 4]} />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
