import type { Question } from "./types";
import { SKILLS, type SkillId } from "@/engine/skills";

const VALID_SKILL_IDS = new Set<string>(SKILLS.map((s) => s.id));

export function validateQuestion(raw: unknown): asserts raw is Question {
  if (typeof raw !== "object" || raw === null) throw new Error("Question must be object");
  const q = raw as Record<string, unknown>;

  if (typeof q.id !== "string" || q.id.length === 0) throw new Error("id must be non-empty string");
  if (!["mc", "multi-mc", "numeric", "multi-part"].includes(q.type as string))
    throw new Error(`unknown type: ${q.type}`);
  if (!Array.isArray(q.skills) || q.skills.length === 0)
    throw new Error("skills must be non-empty array");
  for (const s of q.skills as string[]) {
    if (!VALID_SKILL_IDS.has(s)) throw new Error(`unknown skill id: ${s}`);
  }
  if (typeof q.difficulty !== "number" || q.difficulty < 0 || q.difficulty > 1)
    throw new Error(`difficulty must be in [0,1], got ${q.difficulty}`);
  if (typeof q.stem !== "string" || q.stem.length === 0) throw new Error("stem required");
  if (typeof q.explanation !== "string") throw new Error("explanation required");

  if (q.type === "mc") {
    if (!Array.isArray(q.options) || q.options.length < 2)
      throw new Error("mc: options must have ≥ 2 entries");
    if (
      typeof q.correct !== "number" ||
      q.correct < 0 ||
      q.correct >= (q.options as unknown[]).length
    )
      throw new Error(`mc: correct index out of range`);
  } else if (q.type === "multi-mc") {
    if (!Array.isArray(q.options) || q.options.length < 2)
      throw new Error("multi-mc: options required");
    if (!Array.isArray(q.correct)) throw new Error("multi-mc: correct must be array");
    for (const idx of q.correct as number[]) {
      if (idx < 0 || idx >= (q.options as unknown[]).length)
        throw new Error("multi-mc: correct index out of range");
    }
  } else if (q.type === "numeric") {
    const c = q.correct as { value?: unknown; tolerance?: unknown } | undefined;
    if (!c || typeof c.value !== "number" || typeof c.tolerance !== "number")
      throw new Error("numeric: correct must be { value, tolerance }");
  } else if (q.type === "multi-part") {
    if (!Array.isArray(q.parts) || q.parts.length < 2)
      throw new Error("multi-part: parts must have ≥ 2 entries");
    for (const partRaw of q.parts as unknown[]) {
      const p = partRaw as Record<string, unknown>;
      if (typeof p.label !== "string" || p.label.length === 0)
        throw new Error("multi-part: part.label required");
      if (typeof p.stem !== "string" || p.stem.length === 0)
        throw new Error("multi-part: part.stem required");
      if (typeof p.explanation !== "string")
        throw new Error("multi-part: part.explanation required");
      if (p.type === "mc") {
        if (!Array.isArray(p.options) || p.options.length < 2)
          throw new Error("multi-part mc: options must have ≥ 2 entries");
        if (
          typeof p.correct !== "number" ||
          p.correct < 0 ||
          p.correct >= (p.options as unknown[]).length
        )
          throw new Error("multi-part mc: correct index out of range");
      } else if (p.type === "numeric") {
        const c = p.correct as { value?: unknown; tolerance?: unknown } | undefined;
        if (!c || typeof c.value !== "number" || typeof c.tolerance !== "number")
          throw new Error("multi-part numeric: correct must be { value, tolerance }");
      } else {
        throw new Error(`multi-part: unknown part type ${p.type}`);
      }
    }
  }
}

export function loadBank(rawList: unknown[]): Map<string, Question> {
  const bank = new Map<string, Question>();
  for (const raw of rawList) {
    validateQuestion(raw);
    if (bank.has(raw.id)) throw new Error(`duplicate question id: ${raw.id}`);
    bank.set(raw.id, raw);
  }
  return bank;
}

export type { Question, SkillId };
