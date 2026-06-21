import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BayesTree } from "./BayesTree";

describe("BayesTree", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(
      <BayesTree prior={0.1} condIfA={0.9} condIfNotA={0.05} />,
    );
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });

  it("shows custom labels", () => {
    const { container } = render(
      <BayesTree
        prior={0.3}
        condIfA={0.95}
        condIfNotA={0.02}
        labels={["krank", "gesund", "+", "−"]}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("krank");
    expect(text).toContain("gesund");
  });

  it("renders the joint probabilities for all 4 leaves", () => {
    const { container } = render(
      <BayesTree prior={0.5} condIfA={0.5} condIfNotA={0.5} />,
    );
    const text = container.textContent ?? "";
    // 4 leaves with joint probabilities, each should be 0.25 here
    const matches = text.match(/0\.2500/g) ?? [];
    expect(matches.length).toBe(4);
  });
});
