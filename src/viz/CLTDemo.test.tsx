import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CLTDemo } from "./CLTDemo";

describe("CLTDemo", () => {
  it("renders a canvas with role=img", () => {
    const { container } = render(<CLTDemo distribution="uniform" n={30} />);
    expect(container.querySelector("canvas[role='img']")).not.toBeNull();
  });
});
