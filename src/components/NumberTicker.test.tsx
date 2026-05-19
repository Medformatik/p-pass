import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NumberTicker } from "./NumberTicker";

describe("NumberTicker", () => {
  it("renders initial value rounded", () => {
    render(<NumberTicker value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("applies format function", () => {
    render(<NumberTicker value={0.5} format={(n) => `${(n * 100).toFixed(0)}%`} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
