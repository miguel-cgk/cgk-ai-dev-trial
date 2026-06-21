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
});
