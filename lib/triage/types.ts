import type { Category, Priority } from "@prisma/client";

/** How strongly the helper's signals back its suggestion. */
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type TriageInput = {
  title: string;
  description?: string;
  category?: Category;
};

export type TriageResult = {
  priority: Priority;
  category: Category;
  confidence: Confidence;
  reasons: string[];
};

/**
 * The triage helper contract. The rule-based engine implements this today;
 * an LLM-backed strategy could drop in behind the same interface (future work).
 */
export interface TriageStrategy {
  suggest(input: TriageInput): TriageResult;
}
