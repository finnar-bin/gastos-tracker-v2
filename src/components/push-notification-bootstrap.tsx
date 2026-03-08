"use client";

import { useEffect } from "react";

type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function base64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function syncSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON() as PushSubscriptionPayload;
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
}

export function PushNotificationBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    const run = async () => {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const profileResponse = await fetch("/api/profile/push-setting", {
        cache: "no-store",
      });
      const profileJson = (await profileResponse.json().catch(() => null)) as {
        pushNotificationsEnabled?: boolean;
      } | null;
      const pushEnabled = profileJson?.pushNotificationsEnabled ?? true;

      if (!pushEnabled) {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          const endpoint = existing.endpoint;
          await existing.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }
        return;
      }

      // Request permission once per browser profile unless already decided.
      const asked = localStorage.getItem("push_permission_asked") === "1";
      if (Notification.permission === "default" && !asked) {
        localStorage.setItem("push_permission_asked", "1");
        await Notification.requestPermission();
      }

      if (Notification.permission !== "granted") return;

      const current = await registration.pushManager.getSubscription();
      if (current) {
        await syncSubscription(current);
        return;
      }

      const created = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(publicKey),
      });

      await syncSubscription(created);
    };

    void run();
  }, []);

  return null;
}
