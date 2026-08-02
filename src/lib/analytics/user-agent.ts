import "server-only";

/**
 * A deliberately small user-agent classifier.
 *
 * A full UA database (ua-parser-js et al.) is ~200KB of regexes maintained for
 * fingerprinting-grade accuracy. All this dashboard needs is a device class and
 * a browser/OS family, so the trade is worth it — anything unrecognised falls
 * through to "Unknown" rather than being guessed at.
 */

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export type ParsedUserAgent = {
  device: DeviceType;
  browser: string | null;
  os: string | null;
};

/**
 * Crawlers, uptime monitors, previewers and scrapers. These never reach the
 * tracking script in practice (it needs JS), but the collect endpoint is a
 * public URL, so it is checked there too.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|whatsapp|telegram|slackbot|discordbot|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|perplexity|applebot|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pingdom|uptimerobot|statuscake|curl\/|wget\/|python-requests|axios\/|go-http-client|okhttp|java\/|libwww-perl/i;

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length < 8) return true;
  return BOT_PATTERN.test(userAgent);
}

// Order matters: every Chromium fork advertises "Chrome", and Edge/Opera also
// advertise "Safari", so the most specific token has to win.
const BROWSERS: ReadonlyArray<[RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bYaBrowser\//, "Yandex"],
  [/\bVivaldi\//, "Vivaldi"],
  [/\bBrave\//, "Brave"],
  [/\bFxiOS\/|\bFirefox\//, "Firefox"],
  [/\bCriOS\/|\bChrome\//, "Chrome"],
  [/\bSafari\//, "Safari"],
];

const OPERATING_SYSTEMS: ReadonlyArray<[RegExp, string]> = [
  [/\bWindows NT\b/, "Windows"],
  [/\biPhone\b|\biPad\b|\biPod\b/, "iOS"],
  [/\bMac OS X\b|\bMacintosh\b/, "macOS"],
  [/\bAndroid\b/, "Android"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bLinux\b|\bX11\b/, "Linux"],
];

function classifyDevice(userAgent: string, clientHintMobile: boolean): DeviceType {
  if (/\biPad\b/.test(userAgent) || /\bTablet\b/i.test(userAgent)) return "tablet";
  // Android without "Mobile" is the conventional tablet signal.
  if (/\bAndroid\b/.test(userAgent) && !/\bMobile\b/.test(userAgent)) {
    return "tablet";
  }
  if (/\bMobi\b|\bMobile\b|\biPhone\b|\biPod\b|\bWindows Phone\b/.test(userAgent)) {
    return "mobile";
  }
  if (clientHintMobile) return "mobile";
  if (/\bWindows NT\b|\bMacintosh\b|\bX11\b|\bCrOS\b|\bLinux\b/.test(userAgent)) {
    return "desktop";
  }
  return "unknown";
}

/**
 * `clientHintMobile` comes from the `Sec-CH-UA-Mobile` header, which is the
 * only reliable signal left on Chromium's reduced user-agent string.
 */
export function parseUserAgent(
  userAgent: string | null,
  clientHintMobile = false,
): ParsedUserAgent {
  if (!userAgent) {
    return { device: clientHintMobile ? "mobile" : "unknown", browser: null, os: null };
  }

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
  const os = OPERATING_SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;

  return { device: classifyDevice(userAgent, clientHintMobile), browser, os };
}
