export type ParsedDevice = {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  label: string;
};

export function parseUserAgent(ua?: string | null): ParsedDevice {
  if (!ua || !ua.trim()) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
      label: "Browser Session",
    };
  }

  let os = "Unknown OS";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  if (/iPad/i.test(ua)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/iPhone/i.test(ua)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = "Windows";
  } else if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  let browser = "Browser";
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(ua) && !/Chromium\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  }

  return {
    browser,
    os,
    deviceType,
    label: `${browser} on ${os}`,
  };
}
