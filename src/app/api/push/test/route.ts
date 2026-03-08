import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const subscriptions = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dhKey: pushSubscriptions.p256dhKey,
      authKey: pushSubscriptions.authKey,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.isActive, true),
      ),
    );

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: "No active push subscription found for this user." },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({
    title: "Test Notification",
    body: "Push notifications are working.",
    url: "/sheet",
  });

  let sent = 0;
  for (const subscription of subscriptions) {
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
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: "Failed to deliver test notification." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, sent });
}
