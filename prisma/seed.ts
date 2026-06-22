import { PrismaClient, type Category, type Priority, type Status } from "@prisma/client";

const prisma = new PrismaClient();

const ownerUserId = process.env.SEED_OWNER_USER_ID?.trim() || null;
const ownerName = process.env.SEED_OWNER_NAME?.trim() || "John Doe";
const creatorId = ownerUserId ?? "seed-script";
const creatorName = ownerUserId ? ownerName : "Seed script";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

type SeedItem = {
  title: string;
  requester: string;
  category: Category;
  priority: Priority;
  status: Status;
  owned: boolean;
  daysAgo: number;
  description?: string;
  notes?: string[];
};

const items: SeedItem[] = [
  {
    title: "Can't log into the payroll portal",
    requester: "Dana Whitfield (Finance)",
    category: "ACCESS",
    priority: "URGENT",
    status: "IN_PROGRESS",
    owned: true,
    daysAgo: 0,
    description: "Locked out after the SSO migration. Payroll run is due tomorrow.",
    notes: ["Reset MFA enrollment, waiting on user to confirm.", "User confirmed access restored — verifying payroll role."],
  },
  {
    title: "Production checkout returning 500s",
    requester: "PagerDuty alert",
    category: "INCIDENT",
    priority: "URGENT",
    status: "TRIAGE",
    owned: false,
    daysAgo: 0,
    description: "Error rate spiked on /checkout for all users about 10 minutes ago.",
  },
  {
    title: "Q2 sales report export comes back empty",
    requester: "Marcus Lee (Sales)",
    category: "DATA",
    priority: "HIGH",
    status: "IN_PROGRESS",
    owned: true,
    daysAgo: 1,
    notes: ["Reproduced — the date filter excludes the final day of the quarter."],
  },
  {
    title: "How do I set up SSO for my team?",
    requester: "Priya Nair (IT)",
    category: "QUESTION",
    priority: "LOW",
    status: "RESOLVED",
    owned: true,
    daysAgo: 3,
    description: "Looking for the self-serve steps to enable SSO for a new department.",
    notes: ["Shared the SSO onboarding doc and a sample config."],
  },
  {
    title: "Duplicate customer records after the CRM import",
    requester: "Support team",
    category: "DATA",
    priority: "MEDIUM",
    status: "BLOCKED",
    owned: false,
    daysAgo: 2,
    description: "~120 contacts appear twice. Need a dedupe key before cleanup.",
    notes: ["Blocked pending confirmation of the canonical matching field."],
  },
  {
    title: "VPN access for a new contractor",
    requester: "Oliver Grant (Ops)",
    category: "ACCESS",
    priority: "MEDIUM",
    status: "TRIAGE",
    owned: false,
    daysAgo: 1,
  },
  {
    title: "Dashboard charts not loading in Safari",
    requester: "Beta user",
    category: "INCIDENT",
    priority: "HIGH",
    status: "TRIAGE",
    owned: false,
    daysAgo: 2,
    description: "Charts render blank in Safari 17; fine in Chrome and Firefox.",
  },
  {
    title: "Bulk delete archived tickets older than a year",
    requester: "Sofia Reyes",
    category: "OTHER",
    priority: "LOW",
    status: "TRIAGE",
    owned: false,
    daysAgo: 5,
  },
  {
    title: "Password reset email never arrives",
    requester: "Customer #4821",
    category: "ACCESS",
    priority: "HIGH",
    status: "IN_PROGRESS",
    owned: true,
    daysAgo: 1,
    notes: ["Confirmed the address isn't on the bounce list; checking the mail provider."],
  },
  {
    title: "Migrate legacy invoices to the new schema",
    requester: "Finance",
    category: "DATA",
    priority: "MEDIUM",
    status: "BLOCKED",
    owned: true,
    daysAgo: 6,
    description: "Waiting on a frozen cutoff date before backfilling historical invoices.",
  },
  {
    title: "Clarify the data retention policy",
    requester: "Legal",
    category: "QUESTION",
    priority: "LOW",
    status: "RESOLVED",
    owned: false,
    daysAgo: 8,
    notes: ["Answered: 24 months for operational logs, 7 years for financial records."],
  },
  {
    title: "Office printer offline on the 3rd floor",
    requester: "Facilities",
    category: "OTHER",
    priority: "MEDIUM",
    status: "RESOLVED",
    owned: true,
    daysAgo: 4,
    notes: ["Power-cycled the print server; back online."],
  },
];

async function main() {
  if (!ownerUserId) {
    console.warn(
      "⚠  SEED_OWNER_USER_ID is not set — seeded requests will be unassigned.\n" +
        "   Set it to your demo Clerk user id so some requests are owned by the reviewer.",
    );
  }

  await prisma.request.deleteMany();

  for (const item of items) {
    const createdAt = new Date(Date.now() - item.daysAgo * DAY);
    const assigned = item.owned && Boolean(ownerUserId);

    const activity: {
      type: "CREATED" | "STATUS_CHANGED" | "PRIORITY_CHANGED" | "OWNER_CHANGED" | "NOTE_ADDED";
      actorId: string;
      actorName: string;
      field?: string;
      fromValue?: string;
      toValue?: string;
      createdAt: Date;
    }[] = [{ type: "CREATED", actorId: creatorId, actorName: creatorName, createdAt }];

    if (assigned) {
      activity.push({
        type: "OWNER_CHANGED",
        actorId: ownerUserId!,
        actorName: ownerName,
        field: "owner",
        fromValue: "Unassigned",
        toValue: ownerName,
        createdAt: new Date(createdAt.getTime() + HOUR),
      });
    }

    if (item.status !== "TRIAGE") {
      activity.push({
        type: "STATUS_CHANGED",
        actorId: creatorId,
        actorName: assigned ? ownerName : creatorName,
        field: "status",
        fromValue: "TRIAGE",
        toValue: item.status,
        createdAt: new Date(createdAt.getTime() + 2 * HOUR),
      });
    }

    (item.notes ?? []).forEach((body, i) => {
      activity.push({
        type: "NOTE_ADDED",
        actorId: creatorId,
        actorName: assigned ? ownerName : creatorName,
        createdAt: new Date(createdAt.getTime() + (3 + i) * HOUR),
      });
    });

    await prisma.request.create({
      data: {
        title: item.title,
        description: item.description ?? null,
        requester: item.requester,
        category: item.category,
        priority: item.priority,
        status: item.status,
        ownerId: assigned ? ownerUserId : null,
        ownerName: assigned ? ownerName : null,
        createdById: creatorId,
        createdByName: creatorName,
        createdAt,
        notes: {
          create: (item.notes ?? []).map((body, i) => ({
            authorId: creatorId,
            authorName: assigned ? ownerName : creatorName,
            body,
            createdAt: new Date(createdAt.getTime() + (3 + i) * HOUR),
          })),
        },
        activity: { create: activity },
      },
    });
  }

  const count = await prisma.request.count();
  console.log(`✔ Seeded ${count} requests${ownerUserId ? ` (some owned by ${ownerName})` : ""}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
