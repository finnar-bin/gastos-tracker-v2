import { NextResponse } from "next/server";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import {
  categories,
  categoryReminderDeliveries,
  profiles,
  pushSubscriptions,
  sheetUsers,
} from "@/lib/db/schema";

type ReminderFrequency = "specific_date" | "daily" | "weekly" | "monthly";

function getLocalParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "0");
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const localDate = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  return { year, month, day, hour, localDate };
}

function parseDateOnly(dateString: string) {
  const [year, month, day] = dateString.split("-").map((part) => Number(part));
  return { year, month, day };
}

function daysInMonth(year: number, monthOneBased: number) {
  return new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();
}

function isDueToday(args: {
  frequency: ReminderFrequency;
  dueDate: string;
  localYear: number;
  localMonth: number;
  localDay: number;
  localDate: string;
}) {
  const due = parseDateOnly(args.dueDate);
  const currentUtcDate = new Date(`${args.localDate}T00:00:00.000Z`);
  const dueUtcDate = new Date(`${args.dueDate}T00:00:00.000Z`);

  if (currentUtcDate < dueUtcDate) return false;

  if (args.frequency === "specific_date") {
    return args.localDate === args.dueDate;
  }

  if (args.frequency === "daily") {
    return true;
  }

  if (args.frequency === "weekly") {
    const diffMs = currentUtcDate.getTime() - dueUtcDate.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    return diffDays % 7 === 0;
  }

  const monthlyTargetDay = Math.min(
    due.day,
    daysInMonth(args.localYear, args.localMonth),
  );
  return args.localDay === monthlyTargetDay;
}

type CandidateRow = {
  categoryId: string;
  categoryName: string;
  dueDate: string;
  dueReminderFrequency: ReminderFrequency;
  sheetId: string;
  userId: string;
  timeZone: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT ?? "mailto:no-reply@gastos.local";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: "Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY" },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const today = new Date().toISOString().split("T")[0];

  const candidates = (await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      dueDate: categories.dueDate,
      dueReminderFrequency: categories.dueReminderFrequency,
      sheetId: categories.sheetId,
      userId: sheetUsers.userId,
      timeZone: profiles.timeZone,
      endpoint: pushSubscriptions.endpoint,
      p256dhKey: pushSubscriptions.p256dhKey,
      authKey: pushSubscriptions.authKey,
    })
    .from(categories)
    .innerJoin(sheetUsers, eq(categories.sheetId, sheetUsers.sheetId))
    .innerJoin(profiles, eq(sheetUsers.userId, profiles.id))
    .innerJoin(
      pushSubscriptions,
      and(
        eq(pushSubscriptions.userId, sheetUsers.userId),
        eq(pushSubscriptions.isActive, true),
      ),
    )
    .where(
      and(
        isNotNull(categories.dueDate),
        isNotNull(categories.dueReminderFrequency),
        eq(profiles.pushNotificationsEnabled, true),
        lte(categories.dueDate, today),
      ),
    )) as CandidateRow[];

  if (candidates.length === 0) {
    return NextResponse.json({
      message: "No category reminders to process",
      processed: 0,
    });
  }

  const grouped = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      dueDate: string;
      frequency: ReminderFrequency;
      sheetId: string;
      userId: string;
      timeZone: string;
      subscriptions: Array<{
        endpoint: string;
        p256dhKey: string;
        authKey: string;
      }>;
    }
  >();

  for (const row of candidates) {
    const key = `${row.categoryId}:${row.userId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.subscriptions.push({
        endpoint: row.endpoint,
        p256dhKey: row.p256dhKey,
        authKey: row.authKey,
      });
      continue;
    }

    grouped.set(key, {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      dueDate: row.dueDate,
      frequency: row.dueReminderFrequency,
      sheetId: row.sheetId,
      userId: row.userId,
      timeZone: row.timeZone,
      subscriptions: [
        {
          endpoint: row.endpoint,
          p256dhKey: row.p256dhKey,
          authKey: row.authKey,
        },
      ],
    });
  }

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of grouped.values()) {
    processed += 1;
    const now = new Date();
    const local = getLocalParts(now, item.timeZone || "UTC");

    // Fire reminders at 8:00 local time.
    if (local.hour !== 8) {
      skipped += 1;
      continue;
    }

    if (
      !isDueToday({
        frequency: item.frequency,
        dueDate: item.dueDate,
        localYear: local.year,
        localMonth: local.month,
        localDay: local.day,
        localDate: local.localDate,
      })
    ) {
      skipped += 1;
      continue;
    }

    const [alreadyDelivered] = await db
      .select({ id: categoryReminderDeliveries.id })
      .from(categoryReminderDeliveries)
      .where(
        and(
          eq(categoryReminderDeliveries.userId, item.userId),
          eq(categoryReminderDeliveries.categoryId, item.categoryId),
          eq(categoryReminderDeliveries.localDate, local.localDate),
        ),
      )
      .limit(1);

    if (alreadyDelivered) {
      skipped += 1;
      continue;
    }

    const payload = JSON.stringify({
      title: "Category Due Reminder",
      body: `${item.categoryName} is due today.`,
      url: `/sheet/${item.sheetId}/settings/category`,
    });

    let successCount = 0;
    for (const subscription of item.subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          },
          payload,
        );
        successCount += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
        }
      }
    }

    if (successCount === 0) {
      continue;
    }

    await db.insert(categoryReminderDeliveries).values({
      categoryId: item.categoryId,
      userId: item.userId,
      localDate: local.localDate,
      sentAt: new Date(),
    });

    await db
      .update(categories)
      .set({ dueLastNotifiedOn: local.localDate })
      .where(eq(categories.id, item.categoryId));

    sent += successCount;
  }

  return NextResponse.json({
    success: true,
    processed,
    sent,
    skipped,
    failed,
  });
}
