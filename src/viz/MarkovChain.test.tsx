import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MarkovChain } from "./MarkovChain";

describe("MarkovChain", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<MarkovChain />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
