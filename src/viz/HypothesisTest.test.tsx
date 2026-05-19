import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HypothesisTest } from "./HypothesisTest";

describe("HypothesisTest", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(
      <HypothesisTest mu0={0} mu1={2} sigma={1} alpha={0.05} />,
    );
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
