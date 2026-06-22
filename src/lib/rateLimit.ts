const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { ok: boolean; remaining: number } {
  const k = `${key}:${ip}`;
  const now = Date.now();
  const entry = store.get(k);

  if (!entry || now > entry.resetAt) {
    store.set(k, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: max - entry.count };
}

export function getClientIp(req: Request): string {
  const headers = new Headers((req as Request & { headers: Headers }).headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
