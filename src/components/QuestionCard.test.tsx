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

const numericQ: Question = {
  id: "qn",
  type: "numeric",
  skills: ["binomial-poisson"],
  difficulty: 0.4,
  stem: "Was ist 1+1?",
  correct: { value: 2, tolerance: 0.01 },
  explanation: "Trivial.",
};

describe("QuestionCard numeric", () => {
  it("accepts numeric answer within tolerance", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={numericQ} onAnswered={onAnswered} />);
    const input = screen.getByPlaceholderText(/antwort eingeben/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2.005" } });
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(true);
  });

  it("rejects numeric answer outside tolerance", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={numericQ} onAnswered={onAnswered} />);
    const input = screen.getByPlaceholderText(/antwort eingeben/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(false);
  });
});

const multiQ: Question = {
  id: "qm",
  type: "multi-mc",
  skills: ["bayes"],
  difficulty: 0.5,
  stem: "Welche sind richtig?",
  options: ["A", "B", "C", "D"],
  correct: [0, 2],
  explanation: "A und C.",
};

describe("QuestionCard multi-mc", () => {
  it("renders all options as checkboxes", () => {
    const { container } = render(<QuestionCard question={multiQ} onAnswered={() => {}} />);
    const boxes = container.querySelectorAll('input[type="checkbox"]');
    expect(boxes.length).toBe(4);
  });

  it("returns correct=true for exact set match", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={multiQ} onAnswered={onAnswered} />);
    // Find labels by text content and click them
    fireEvent.click(screen.getByText("A").closest("label")!);
    fireEvent.click(screen.getByText("C").closest("label")!);
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(true);
  });

  it("returns correct=false for incomplete selection", () => {
    const onAnswered = vi.fn();
    render(<QuestionCard question={multiQ} onAnswered={onAnswered} />);
    fireEvent.click(screen.getByText("A").closest("label")!);
    fireEvent.click(screen.getByText(/prüfen/i));
    expect(onAnswered).toHaveBeenCalledWith(false);
  });
});
