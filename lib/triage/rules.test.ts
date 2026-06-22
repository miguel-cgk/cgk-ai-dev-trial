import { describe, expect, it } from "vitest";
import { suggestTriage } from "./rules";

describe("ruleTriage", () => {
  it("starts a plain question at LOW", () => {
    const result = suggestTriage({ title: "How do I export my data?", category: "QUESTION" });
    expect(result.priority).toBe("LOW");
  });

  it("starts an incident at HIGH baseline", () => {
    const result = suggestTriage({ title: "The dashboard looks odd", category: "INCIDENT" });
    expect(result.priority).toBe("HIGH");
  });

  it("escalates to URGENT on critical phrases", () => {
    const result = suggestTriage({
      title: "Production is down for all users",
      category: "INCIDENT",
    });
    expect(result.priority).toBe("URGENT");
  });

  it("raises a low-baseline category when a high-impact phrase appears", () => {
    const result = suggestTriage({
      title: "I have a question but the export keeps failing",
      category: "QUESTION",
    });
    expect(result.priority).toBe("HIGH");
  });

  it("honours the selected category over keyword detection", () => {
    const result = suggestTriage({ title: "login broken", category: "QUESTION" });
    expect(result.category).toBe("QUESTION");
  });

  it("detects the category from text when none is given", () => {
    const result = suggestTriage({ title: "Can't login to my account" });
    expect(result.category).toBe("ACCESS");
  });

  it("falls back to OTHER / MEDIUM with no signal", () => {
    const result = suggestTriage({ title: "Misc request about stuff" });
    expect(result.category).toBe("OTHER");
    expect(result.priority).toBe("MEDIUM");
  });

  it("always returns at least one human-readable reason", () => {
    const result = suggestTriage({ title: "Production outage", category: "INCIDENT" });
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("does not escalate on substrings (word-boundary matching)", () => {
    const result = suggestTriage({ title: "How do I download the report?" });
    // "down" inside "download" must not trigger the INCIDENT urgency keyword.
    expect(result.priority).toBe("MEDIUM");
  });

  it("picks the strongest category by score, not the first match", () => {
    const result = suggestTriage({ title: "Can't log in and getting a 500 error" });
    // ACCESS matches ("log in") but INCIDENT scores higher ("500" + "error").
    expect(result.category).toBe("INCIDENT");
  });

  it("reports HIGH confidence when category and urgency both signal", () => {
    const result = suggestTriage({
      title: "Production is down for all users",
      category: "INCIDENT",
    });
    expect(result.confidence).toBe("HIGH");
  });

  it("reports MEDIUM confidence with a category signal but no urgency", () => {
    const result = suggestTriage({ title: "How do I reset my password?" });
    expect(result.category).toBe("ACCESS");
    expect(result.confidence).toBe("MEDIUM");
  });

  it("reports LOW confidence when nothing meaningful matches", () => {
    const result = suggestTriage({ title: "Misc request about stuff" });
    expect(result.confidence).toBe("LOW");
  });
});
