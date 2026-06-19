const tracked = new Set<string>();

export function trackEvent(name: string, once = false) {
  if (once && tracked.has(name)) return;
  if (once) tracked.add(name);
  try {
    const w = window as any;
    // 51.la 新版 SDK
    if (w.LA?.event) {
      w.LA.event({ name });
    }
    // 51.la 旧版 SDK 回退
    if (w._LA?.emit) {
      w._LA.emit(name);
    }
  } catch {}
}
