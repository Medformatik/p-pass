import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BayesUpdater } from "./BayesUpdater";

describe("BayesUpdater", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<BayesUpdater prior={0.1} sensitivity={0.9} fpr={0.05} />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
