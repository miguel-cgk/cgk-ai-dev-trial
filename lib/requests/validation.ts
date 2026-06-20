import { z } from "zod";

export const statusSchema = z.enum(["TRIAGE", "IN_PROGRESS", "BLOCKED", "RESOLVED"]);
export const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const categorySchema = z.enum(["ACCESS", "INCIDENT", "DATA", "QUESTION", "OTHER"]);

export const createRequestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  requester: z.string().trim().min(1, "Requester is required").max(120),
  category: categorySchema,
  priority: prioritySchema.default("MEDIUM"),
});

export const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(5000),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
