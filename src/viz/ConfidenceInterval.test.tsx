import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ConfidenceInterval } from "./ConfidenceInterval";

describe("ConfidenceInterval", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(
      <ConfidenceInterval mu={0} sigma={1} n={30} />,
    );
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
