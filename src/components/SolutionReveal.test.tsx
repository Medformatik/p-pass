import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SolutionReveal } from "./SolutionReveal";

describe("SolutionReveal", () => {
  it("renders nothing when no steps", () => {
    const { container } = render(<SolutionReveal steps={[]} />);
    expect(container.textContent).toBe("");
  });

  it("hides steps initially behind a 'Lösungsschritte zeigen' toggle", () => {
    render(<SolutionReveal steps={["Schritt eins", "Schritt zwei"]} />);
    expect(screen.queryByText("Schritt eins")).not.toBeInTheDocument();
    expect(screen.getByText(/lösungsschritte zeigen/i)).toBeInTheDocument();
  });

  it("reveals steps after click", () => {
    render(<SolutionReveal steps={["A", "B", "C"]} />);
    fireEvent.click(screen.getByText(/lösungsschritte zeigen/i));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});
