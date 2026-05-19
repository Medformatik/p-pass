import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BinomialPMF } from "./BinomialPMF";

describe("BinomialPMF", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<BinomialPMF n={10} p={0.5} />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
