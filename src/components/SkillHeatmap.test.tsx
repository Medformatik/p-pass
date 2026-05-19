import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SkillHeatmap } from "./SkillHeatmap";

describe("SkillHeatmap", () => {
  it("renders one cell per skill", () => {
    const { container } = render(
      <MemoryRouter>
        <SkillHeatmap />
      </MemoryRouter>,
    );
    const cells = container.querySelectorAll("[data-skill]");
    expect(cells.length).toBe(20);
  });

  it("each cell shows the skill label", () => {
    render(
      <MemoryRouter>
        <SkillHeatmap />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Satz von Bayes/i)).toBeInTheDocument();
    expect(screen.getByText(/Zentraler Grenzwertsatz/i)).toBeInTheDocument();
  });

  it("groups skills by block", () => {
    render(
      <MemoryRouter>
        <SkillHeatmap />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Deskriptiv" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Wahrscheinlichkeit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Schließend" })).toBeInTheDocument();
  });
});
