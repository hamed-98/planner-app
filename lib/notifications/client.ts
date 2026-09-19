// lib/notifications/client.ts

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!(await isPushNotificationSupported())) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function registerPushSubscription(userCurrentTimezone?: string): Promise<PushSubscription | null> {
  if (!(await isPushNotificationSupported())) {
    console.warn('[Push] Push notifications are not supported in this browser.');
    return null;
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[Push] Notification permission denied.');
        return null;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // استخراج تایمزون دقیق کاربر
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran';
    const shouldUpdateTz = userCurrentTimezone !== localTz;

    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub,
        timezone: shouldUpdateTz ? localTz : undefined,
      }),
    });

    if (!res.ok) {
      console.error('[Push] Failed to save subscription on server:', await res.text());
    }

    return sub;
  } catch (err) {
    console.error('[Push] Registration error:', err);
    return null;
  }
}

export async function unsubscribePushNotification(): Promise<boolean> {
  try {
    const sub = await getPushSubscription();
    if (sub) {
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
    return false;
  }
}
