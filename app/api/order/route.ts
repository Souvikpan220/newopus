// ============================================
// BACKEND API ROUTE — /api/order
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// ============================
// CONFIG
// ============================
const SMM_API_URL = 'https://luvsmm.com/api/v2';
const SMM_API_KEY = process.env.SMM_API_KEY!;
const SMM_SERVICE_ID = '160';
const ORDER_QUANTITY = 500;

const DISCORD_ORDER_WEBHOOK = process.env.DISCORD_ORDER_WEBHOOK!;
const DISCORD_TRACKING_WEBHOOK = process.env.DISCORD_TRACKING_WEBHOOK!;

// ============================
// RATE LIMIT SYSTEM
// ============================
interface RateLimitEntry {
  count: number;
  firstUse: number;
  lastUse: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_USES_PER_DAY = 3;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 mins

// Cleanup old (previous day) entries
function cleanupRateLimits() {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todayStart = todayMidnight.getTime();

  for (const [ip, entry] of Array.from(rateLimitStore.entries())) {
    if (entry.firstUse < todayStart) {
      rateLimitStore.delete(ip);
    }
  }
}

// Main rate limit logic
function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  cleanupRateLimits();

  const now = Date.now();

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todayStart = todayMidnight.getTime();

  const entry = rateLimitStore.get(ip);

  // First request
  if (!entry) {
    rateLimitStore.set(ip, {
      count: 1,
      firstUse: todayStart,
      lastUse: now,
    });
    return { allowed: true };
  }

  // Reset at midnight
  if (entry.firstUse < todayStart) {
    rateLimitStore.set(ip, {
      count: 1,
      firstUse: todayStart,
      lastUse: now,
    });
    return { allowed: true };
  }

  // Cooldown check
  if (now - entry.lastUse < COOLDOWN_MS) {
    const minutesLeft = Math.ceil((COOLDOWN_MS - (now - entry.lastUse)) / 60000);
    return {
      allowed: false,
      message: `Wait ${minutesLeft} minute(s) before next order.`,
    };
  }

  // Daily limit
  if (entry.count >= MAX_USES_PER_DAY) {
    return {
      allowed: false,
      message: `Daily limit reached (3/day). Try again after 12 AM or buy Premium.`,
    };
  }

  // Allow
  entry.count += 1;
  entry.lastUse = now;
  rateLimitStore.set(ip, entry);

  return { allowed: true };
}

// ============================
// HELPERS
// ============================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '0.0.0.0';
}

function isValidInstagramReelLink(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/reel\//i,
    /^https?:\/\/(www\.)?instagram\.com\/reels\//i,
    /^https?:\/\/(www\.)?instagram\.com\/p\//i,
  ];
  return patterns.some((p) => p.test(url));
}

async function getCountryFromIP(ip: string): Promise<string> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return `${data.country} (${data.countryCode})`;
      }
    }
  } catch {}

  return 'Unknown';
}

async function sendDiscordWebhook(url: string, payload: object) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('Webhook error:', e);
  }
}

async function sendOrderToSMM(link: string) {
  const res = await fetch(SMM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: SMM_API_KEY,
      action: 'add',
      service: SMM_SERVICE_ID,
      link,
      quantity: ORDER_QUANTITY,
    }),
  });

  return res.json();
}

// ============================
// POST — ORDER
// ============================
export async function POST(request: NextRequest) {
  try {
    const { link } = await request.json();

    if (!link || typeof link !== 'string') {
      return NextResponse.json({ error: 'Invalid link.' }, { status: 400 });
    }

    const trimmedLink = link.trim();

    if (!isValidInstagramReelLink(trimmedLink)) {
      return NextResponse.json({ error: 'Invalid Instagram link.' }, { status: 400 });
    }

    const ip = getClientIP(request);

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.message }, { status: 429 });
    }

    const countryPromise = getCountryFromIP(ip);

    let smmResponse;
    try {
      smmResponse = await sendOrderToSMM(trimmedLink);
    } catch {
      smmResponse = { error: 'SMM failed' };
    }

    const country = await countryPromise;
    const timestamp = new Date().toISOString();

    // Order log
    await sendDiscordWebhook(DISCORD_ORDER_WEBHOOK, {
      embeds: [
        {
          title: '📦 New Views Order',
          color: 0x6366f1,
          fields: [
            { name: 'Link', value: trimmedLink },
            { name: 'Quantity', value: `${ORDER_QUANTITY}`, inline: true },
            { name: 'Country', value: country, inline: true },
            { name: 'IP', value: `||${ip}||`, inline: true },
          ],
          timestamp,
        },
      ],
    });

    // Tracking log
    await sendDiscordWebhook(DISCORD_TRACKING_WEBHOOK, {
      embeds: [
        {
          title: '👤 User Activity',
          fields: [
            { name: 'IP', value: `||${ip}||`, inline: true },
            { name: 'Country', value: country, inline: true },
          ],
          timestamp,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed. 500 views will be delivered within 1 hour.',
      orderId: smmResponse?.order || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================
// GET — TRACK VISITOR
// ============================
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const country = await getCountryFromIP(ip);

  await sendDiscordWebhook(DISCORD_TRACKING_WEBHOOK, {
    embeds: [
      {
        title: '🌐 New Visitor',
        fields: [
          { name: 'IP', value: `||${ip}||`, inline: true },
          { name: 'Country', value: country, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });

  return NextResponse.json({ status: 'ok' });
}
