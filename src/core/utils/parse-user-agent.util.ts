import { UAParser } from 'ua-parser-js';

export function parseUserAgent(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserInfo =
    browser.name && browser.version
      ? `${browser.name} ${browser.version}`
      : 'Unknown browser';

  const osInfo = os.name ? os.name : 'Unknown OS';

  return `${browserInfo} on ${osInfo}`;
}
