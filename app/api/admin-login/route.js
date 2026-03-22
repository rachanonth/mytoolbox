import { NextResponse } from 'next/server';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// In-memory store: { ip -> { count, lockedUntil } }
const attempts = new Map();

function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request) {
  const ip = getIP(request);
  const now = Date.now();

  const record = attempts.get(ip) || { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }

  // Reset count if lockout has expired
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { code } = body;
  const adminCode = process.env.ADMIN_CODE;

  if (!adminCode) {
    return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  if (code === adminCode) {
    // Success — reset attempts
    attempts.delete(ip);
    return NextResponse.json({ ok: true });
  }

  // Wrong code — increment attempt count
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(ip, record);

  const remaining = MAX_ATTEMPTS - record.count;
  const message =
    record.lockedUntil > now
      ? `Too many attempts. Locked for 15 minutes.`
      : `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;

  return NextResponse.json({ error: message }, { status: 401 });
}
