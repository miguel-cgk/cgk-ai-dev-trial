import type { Category, Priority, Status } from "@prisma/client";

export const STATUS_VALUES: Status[] = ["TRIAGE", "IN_PROGRESS", "BLOCKED", "RESOLVED"];
export const PRIORITY_VALUES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const CATEGORY_VALUES: Category[] = ["ACCESS", "INCIDENT", "DATA", "QUESTION", "OTHER"];

export const STATUS_LABEL: Record<Status, string> = {
  TRIAGE: "Triage",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ACCESS: "Access",
  INCIDENT: "Incident",
  DATA: "Data",
  QUESTION: "Question",
  OTHER: "Other",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const PRIORITY_BADGE: Record<Priority, BadgeVariant> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "default",
  URGENT: "destructive",
};

export const STATUS_BADGE: Record<Status, BadgeVariant> = {
  TRIAGE: "outline",
  IN_PROGRESS: "default",
  BLOCKED: "destructive",
  RESOLVED: "secondary",
};

const ACTIVITY_VERB: Record<string, string> = {
  CREATED: "created the request",
  STATUS_CHANGED: "changed status",
  PRIORITY_CHANGED: "changed priority",
  OWNER_CHANGED: "changed owner",
  NOTE_ADDED: "added a note",
};

export function activityVerb(type: string): string {
  return ACTIVITY_VERB[type] ?? "updated the request";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
