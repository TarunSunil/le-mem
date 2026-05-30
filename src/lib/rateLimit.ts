const REQUEST_LIMIT = 30;
const WINDOW_MS = 60_000;

type WindowEntry = {
  count: number;
  reset: number;
};

const userWindowMap = new Map<string, WindowEntry>();

function cleanupExpired(now: number) {
  for (const [key, entry] of userWindowMap.entries()) {
    if (now > entry.reset) {
      userWindowMap.delete(key);
    }
  }
}

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  cleanupExpired(now);

  const entry = userWindowMap.get(key);
  if (!entry || now > entry.reset) {
    userWindowMap.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= REQUEST_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}
