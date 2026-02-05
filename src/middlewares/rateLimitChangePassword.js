/**
 * Rate limit for password change: max 5 attempts per 15 minutes per userId.
 * Must be used after requireAuth so req.userId is set.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const store = new Map(); // userId -> { count, resetAt }

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now >= value.resetAt) store.delete(key);
  }
}

export function rateLimitChangePassword(req, res, next) {
  const userId = req.userId;
  if (!userId) return next();

  const now = Date.now();
  let entry = store.get(userId);
  if (!entry) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(userId, entry);
  }
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    return res.status(429).json({
      message: "비밀번호 변경 시도 횟수를 초과했습니다. 15분 후에 다시 시도해 주세요.",
    });
  }

  cleanup();
  next();
}
