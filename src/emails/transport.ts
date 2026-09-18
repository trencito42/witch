import "server-only";
import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type Mail = { to: string; subject: string; html: string };

function wrap(html: string) {
  return `<!doctype html>
<html><body style="background:#09090b;color:#ececec;font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid #232326;padding:28px;background:#111113;">
    <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#8a8a93;margin-bottom:20px;">Witch</div>
    ${html}
    <p style="margin-top:32px;font-size:12px;color:#6d6d75;">This message was sent by Witch monitoring.</p>
  </div>
</body></html>`;
}

export async function sendMail(mail: Mail) {
  const env = getEnv();
  const html = wrap(mail.html);

  if (env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [mail.to],
        subject: mail.subject,
        html,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status }, "resend send failed");
      throw new Error(`Email provider rejected the message (${response.status}) ${text.slice(0, 120)}`);
    }
    return;
  }

  if (!env.SMTP_HOST) {
    throw new Error("Email is not configured");
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: mail.to,
    subject: mail.subject,
    html,
  });
}
