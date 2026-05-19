import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillSidebar } from "./SkillSidebar";

describe("SkillSidebar", () => {
  it("renders nothing when no skills given", () => {
    const { container } = render(<SkillSidebar skillIds={[]} />);
    expect(container.textContent).toBe("");
  });

  it("renders label for each provided skill", () => {
    render(<SkillSidebar skillIds={["bayes", "clt"]} />);
    expect(screen.getByText(/Satz von Bayes/i)).toBeInTheDocument();
    expect(screen.getByText(/Zentraler Grenzwertsatz/i)).toBeInTheDocument();
  });
});
