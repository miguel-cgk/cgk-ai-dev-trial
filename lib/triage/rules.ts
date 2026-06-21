import type { Category, Priority } from "@prisma/client";
import type { TriageInput, TriageResult, TriageStrategy } from "./types";

const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function isHigher(a: Priority, b: Priority): boolean {
  return PRIORITY_ORDER.indexOf(a) > PRIORITY_ORDER.indexOf(b);
}

/** Where each category starts before any urgency signals are applied. */
const CATEGORY_BASELINE: Record<Category, Priority> = {
  INCIDENT: "HIGH",
  ACCESS: "MEDIUM",
  DATA: "MEDIUM",
  QUESTION: "LOW",
  OTHER: "MEDIUM",
};

type UrgencySignal = { priority: Priority; keywords: string[] };

/** Phrases that raise priority to at least the given level. Order: strongest first. */
const URGENCY_SIGNALS: UrgencySignal[] = [
  {
    priority: "URGENT",
    keywords: [
      "outage",
      "is down",
      "site down",
      "production down",
      "prod down",
      "data loss",
      "breach",
      "security incident",
      "locked out",
      "can't log in",
      "cannot log in",
      "can't login",
      "payment failing",
      "all users",
      "everyone",
      "urgent",
      "asap",
      "sev1",
      "sev 1",
      "p0",
      "critical",
    ],
  },
  {
    priority: "HIGH",
    keywords: [
      "error",
      "failing",
      "failed",
      "broken",
      "not working",
      "blocked",
      "deadline",
      "important",
      "crash",
      "500",
      "timeout",
      "rejected",
    ],
  },
];

const CATEGORY_HINTS: { category: Category; keywords: string[] }[] = [
  {
    category: "ACCESS",
    keywords: ["login", "log in", "password", "access", "permission", "account", "sign in", "sso", "mfa", "2fa", "reset"],
  },
  {
    category: "INCIDENT",
    keywords: ["outage", "down", "error", "crash", "broken", "bug", "500", "not working", "failing", "timeout"],
  },
  {
    category: "DATA",
    keywords: ["report", "export", "record", "duplicate", "migration", "import", "spreadsheet", "csv", "incorrect"],
  },
  {
    category: "QUESTION",
    keywords: ["how do", "how to", "how can", "question", "where do", "explain", "what is", "clarif"],
  },
];

function detectCategory(text: string): Category | null {
  for (const hint of CATEGORY_HINTS) {
    if (hint.keywords.some((k) => text.includes(k))) return hint.category;
  }
  return null;
}

/**
 * Deterministic, dependency-free triage. Implements TriageStrategy so an
 * LLM-backed strategy could later be swapped in behind the same interface.
 */
export const ruleTriage: TriageStrategy = {
  suggest(input: TriageInput): TriageResult {
    const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();
    const reasons: string[] = [];

    const category: Category = input.category ?? detectCategory(haystack) ?? "OTHER";
    if (input.category) {
      reasons.push(`Using the selected category (${category}).`);
    } else if (category !== "OTHER") {
      reasons.push(`Detected category ${category} from the text.`);
    } else {
      reasons.push("No category signal found; defaulting to OTHER.");
    }

    let priority: Priority = CATEGORY_BASELINE[category];
    reasons.push(`${category} requests start at ${priority} priority.`);

    for (const signal of URGENCY_SIGNALS) {
      const match = signal.keywords.find((k) => haystack.includes(k));
      if (match && isHigher(signal.priority, priority)) {
        priority = signal.priority;
        reasons.push(`The phrase "${match}" raised it to ${signal.priority}.`);
      }
    }

    return { priority, category, reasons };
  },
};

export function suggestTriage(input: TriageInput): TriageResult {
  return ruleTriage.suggest(input);
}
