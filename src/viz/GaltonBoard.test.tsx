import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GaltonBoard } from "./GaltonBoard";

describe("GaltonBoard", () => {
  it("renders a canvas element", () => {
    const { container } = render(<GaltonBoard n={10} p={0.5} balls={100} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });
});
