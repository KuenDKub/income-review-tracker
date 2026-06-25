/**
 * Generate a fresh CALENDAR_FEED_TOKEN for the .ics feed.
 * Usage: npm run rotate:calendar-token   (or: node scripts/rotate-calendar-token.js)
 *
 * The .ics feed (/api/calendar/feed.ics?token=...) is authorized only by this
 * token. URLs leak (browser history, logs, referrers), so rotate it if you ever
 * suspect the feed link was exposed. Rotating invalidates the old subscription
 * link — you'll need to re-add the feed in your calendar app afterwards.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { randomBytes } = require("crypto");

const token = randomBytes(32).toString("base64url");

console.log("\nNew CALENDAR_FEED_TOKEN:\n");
console.log(`  ${token}\n`);
console.log("Next steps:");
console.log("  1. Update CALENDAR_FEED_TOKEN in Vercel (Project → Settings → Environment Variables).");
console.log("  2. Update it in your local .env too.");
console.log("  3. Redeploy, then re-subscribe to the feed URL with the new ?token=… in your calendar app.\n");
