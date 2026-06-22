import type { Category, Priority } from "@prisma/client";
import type { Confidence, TriageInput, TriageResult, TriageStrategy } from "./types";

const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function isHigher(a: Priority, b: Priority): boolean {
  return PRIORITY_ORDER.indexOf(a) > PRIORITY_ORDER.indexOf(b);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-token match: a keyword only counts when it isn't glued to surrounding
 * letters/digits. Prevents "down" matching "download" or "500" matching "$1500".
 */
function mentions(haystack: string, keyword: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`, "i");
  return pattern.test(haystack);
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

/**
 * Picks the category with the most keyword hits (not the first one to match), so
 * "can't log in, getting a 500 error" weighs ACCESS vs INCIDENT instead of
 * silently taking whichever rule is listed first. Ties keep CATEGORY_HINTS order.
 */
function detectCategory(text: string): Category | null {
  let best: { category: Category; score: number } | null = null;
  for (const hint of CATEGORY_HINTS) {
    const score = hint.keywords.reduce((n, k) => (mentions(text, k) ? n + 1 : n), 0);
    if (score > 0 && (best === null || score > best.score)) {
      best = { category: hint.category, score };
    }
  }
  return best?.category ?? null;
}

function confidenceFrom(hasCategorySignal: boolean, hasUrgencySignal: boolean): Confidence {
  if (hasCategorySignal && hasUrgencySignal) return "HIGH";
  if (hasCategorySignal || hasUrgencySignal) return "MEDIUM";
  return "LOW";
}

/**
 * Deterministic, dependency-free triage. Implements TriageStrategy so an
 * LLM-backed strategy could later be swapped in behind the same interface.
 */
export const ruleTriage: TriageStrategy = {
  suggest(input: TriageInput): TriageResult {
    const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();
    const reasons: string[] = [];

    const detected = input.category ? null : detectCategory(haystack);
    const category: Category = input.category ?? detected ?? "OTHER";
    const hasCategorySignal = Boolean(input.category) || detected !== null;
    if (input.category) {
      reasons.push(`Using the selected category (${category}).`);
    } else if (detected) {
      reasons.push(`Detected category ${category} from the text.`);
    } else {
      reasons.push("No category signal found; defaulting to OTHER.");
    }

    let priority: Priority = CATEGORY_BASELINE[category];
    reasons.push(`${category} requests start at ${priority} priority.`);

    let hasUrgencySignal = false;
    for (const signal of URGENCY_SIGNALS) {
      const match = signal.keywords.find((k) => mentions(haystack, k));
      if (match) {
        hasUrgencySignal = true;
        if (isHigher(signal.priority, priority)) {
          priority = signal.priority;
          reasons.push(`The phrase "${match}" raised it to ${signal.priority}.`);
        }
      }
    }

    const confidence = confidenceFrom(hasCategorySignal, hasUrgencySignal);
    if (confidence === "LOW") {
      reasons.push("Low confidence: no strong category or urgency signal.");
    }

    return { priority, category, confidence, reasons };
  },
};

export function suggestTriage(input: TriageInput): TriageResult {
  return ruleTriage.suggest(input);
}
