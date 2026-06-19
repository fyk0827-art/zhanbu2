const tracked = new Set<string>();

export function trackEvent(name: string, once = false) {
  if (once && tracked.has(name)) return;
  if (once) tracked.add(name);
  try {
    (window as any).LA?.track?.(name);
  } catch {}
}
