import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Boxplot } from "./Boxplot";

describe("Boxplot", () => {
  it("renders an svg with role=img", () => {
    const { container } = render(<Boxplot data={[1, 2, 3, 4, 5]} />);
    expect(container.querySelector("svg[role='img']")).not.toBeNull();
  });
});
