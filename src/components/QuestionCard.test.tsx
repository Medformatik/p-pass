import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { Question } from "@/questions/types";

const q: Question = {
  id: "q1",
  type: "mc",
  skills: ["bayes"],
  difficulty: 0.3,
  stem: "Was ist 1+1?",
  options: ["1", "2", "3"],
  correct: 1,
  explanation: "Trivial.",
};

describe("QuestionCard", () => {
  it("renders stem and options", () => {
    render(<QuestionCard question={q} onAnswered={() => {}} />);
    expect(screen.getByText("Was ist 1+1?")).toBeInTheDocument();
    expect(screen.getByLabelText(/2$/)).toBeInTheDocument();
  });

  it("calls onAnswered with correct=true when user picks correct option", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={q} onAnswered={onAnswered} />);
    fireEvent.click(screen.getByLabelText(/2$/));
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(true);
  });

  it("calls onAnswered with correct=false when user picks wrong option", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={q} onAnswered={onAnswered} />);
    fireEvent.click(screen.getByLabelText(/3$/));
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(false);
  });

  it("shows explanation after submitting", () => {
    render(<QuestionCard question={q} onAnswered={() => {}} />);
    fireEvent.click(screen.getByLabelText(/2$/));
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(screen.getByText("Trivial.")).toBeInTheDocument();
  });
});
