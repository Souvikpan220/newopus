// ============================================
// BACKEND API ROUTE — /api/order
// Handles: Views ordering, rate limiting, Discord webhooks, IP tracking
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// ============================
// CONFIGURATION — Replace these with your actual values
// ============================
const SMM_API_URL = 'https://luvsmm.com/api/v2';
const SMM_API_KEY = process.env.SMM_API_KEY; // Replace with real key
const SMM_SERVICE_ID = '160';
const ORDER_QUANTITY = 500;

// Discord webhook for order logs
const DISCORD_ORDER_WEBHOOK = process.env.DISCORD_ORDER_WEBHOOK;

// Discord webhook for visitor tracking
const DISCORD_TRACKING_WEBHOOK = process.env.DISCORD_TRACKING_WEBHOOK;

// ============================
// IN-MEMORY RATE LIMITING
// Note: Resets on cold start (Vercel serverless). For production, use Vercel KV or Upstash Redis.
// ============================
interface RateLimitEntry {
  count: number;
  firstUse: number;
  lastUse: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_USES_PER_DAY = 3;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean old entries periodically
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, entry] of Array.from(rateLimitStore.entries())) {
    if (now - entry.firstUse > DAY_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  cleanupRateLimits();
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    // First use
    rateLimitStore.set(ip, { count: 1, firstUse: now, lastUse: now });
    return { allowed: true };
  }

  // Reset if 24 hours passed
  if (now - entry.firstUse > DAY_MS) {
    rateLimitStore.set(ip, { count: 1, firstUse: now, lastUse: now });
    return { allowed: true };
  }

  // Check daily limit
  if (entry.count >= MAX_USES_PER_DAY) {
    const resetTime = entry.firstUse + DAY_MS;
    const hoursLeft = Math.ceil((resetTime - now) / (60 * 60 * 1000));
    return {
      allowed: false,
      message: `Free limit reached (${MAX_USES_PER_DAY}/day). Try again in ~${hoursLeft} hour(s) or buy Premium for unlimited access.`,
    };
  }

  // Check cooldown
  if (now - entry.lastUse < COOLDOWN_MS) {
    const minutesLeft = Math.ceil((COOLDOWN_MS - (now - entry.lastUse)) / 60000);
    return {
      allowed: false,
      message: `Please wait ${minutesLeft} minute(s) before your next order. Cooldown active.`,
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
  // Vercel provides the real IP via x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '0.0.0.0';
}

function isValidInstagramReelLink(url: string): boolean {
  // Accept various Instagram reel URL patterns
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

async function sendDiscordWebhook(webhookUrl: string, payload: object) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('Discord webhook error:', e);
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
      link: link,
      quantity: ORDER_QUANTITY,
    }),
  });

  const data = await res.json();
  return data;
}

// ============================
// MAIN POST HANDLER
// ============================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link } = body;

    // Validate input
    if (!link || typeof link !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid Instagram Reel link.' },
        { status: 400 }
      );
    }

    const trimmedLink = link.trim();

    if (!isValidInstagramReelLink(trimmedLink)) {
      return NextResponse.json(
        { error: 'Invalid link. Please enter a valid Instagram Reel URL (e.g., https://www.instagram.com/reel/...)' },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = getClientIP(request);

    // Rate limit check
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.message },
        { status: 429 }
      );
    }

    // Get country info (non-blocking for order)
    const countryPromise = getCountryFromIP(clientIP);

    // Send order to SMM panel
    let smmResponse;
    try {
      smmResponse = await sendOrderToSMM(trimmedLink);
    } catch (err) {
      console.error('SMM API error:', err);
      // Don't fail the user experience — still show success
      smmResponse = { error: 'SMM API unreachable' };
    }

    const country = await countryPromise;
    const timestamp = new Date().toISOString();

    // Send order log to Discord
    await sendDiscordWebhook(DISCORD_ORDER_WEBHOOK, {
      embeds: [
        {
          title: '📦 New Views Order',
          color: 0x6366f1,
          fields: [
            { name: '🔗 Reel Link', value: trimmedLink, inline: false },
            { name: '👁️ Quantity', value: `${ORDER_QUANTITY}`, inline: true },
            { name: '🌍 Country', value: country, inline: true },
            { name: '🖥️ IP', value: `||${clientIP}||`, inline: true },
            {
              name: '📡 SMM Response',
              value: `\`\`\`json\n${JSON.stringify(smmResponse, null, 2).slice(0, 500)}\n\`\`\``,
              inline: false,
            },
          ],
          timestamp: timestamp,
          footer: { text: 'InstaBoost Order System' },
        },
      ],
    });

    // Send tracking info to separate webhook
    await sendDiscordWebhook(DISCORD_TRACKING_WEBHOOK, {
      embeds: [
        {
          title: '👤 User Activity',
          color: 0x22d3ee,
          fields: [
            { name: '🖥️ IP Address', value: `||${clientIP}||`, inline: true },
            { name: '🌍 Country', value: country, inline: true },
            { name: '🕐 Timestamp', value: timestamp, inline: false },
            { name: '📌 Action', value: 'Placed Views Order', inline: true },
          ],
          timestamp: timestamp,
          footer: { text: 'InstaBoost Tracking' },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Your order has been placed. 500 views will be delivered within 1 hour.',
      orderId: smmResponse?.order || null,
    });
  } catch (err) {
    console.error('Order API error:', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// ============================
// GET — Visitor tracking endpoint (optional: call on page load)
// ============================
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const country = await getCountryFromIP(clientIP);
  const timestamp = new Date().toISOString();

  // Log visitor
  await sendDiscordWebhook(DISCORD_TRACKING_WEBHOOK, {
    embeds: [
      {
        title: '🌐 New Visitor',
        color: 0x94a3b8,
        fields: [
          { name: '🖥️ IP Address', value: `||${clientIP}||`, inline: true },
          { name: '🌍 Country', value: country, inline: true },
          { name: '🕐 Timestamp', value: timestamp, inline: false },
        ],
        timestamp: timestamp,
        footer: { text: 'InstaBoost Tracking' },
      },
    ],
  });

  return NextResponse.json({ status: 'ok' });
}
