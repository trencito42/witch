import "server-only";
import { appUrl, emailEnabled, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMail } from "@/emails/transport";
import {
  incidentEmail,
  invitationEmail,
  monthlyReportEmail,
  passwordResetEmail,
  recoveryEmail,
  statusIncidentSubscriberEmail,
  statusRecoverySubscriberEmail,
  statusSubscriptionConfirmationEmail,
  verificationEmail,
  welcomeEmail,
} from "@/emails/templates";

export async function sendWelcomeEmail(to: string, name: string) {
  if (!emailEnabled()) {
    logger.info({ to, type: "welcome" }, "email skipped: provider not configured");
    return { skipped: true as const };
  }
  await sendMail({
    to,
    subject: "Welcome to Witch",
    html: welcomeEmail({ name, appUrl: appUrl() }),
  });
  return { skipped: false as const };
}

export async function sendVerificationEmail(to: string, url: string) {
  if (!emailEnabled()) {
    logger.info({ type: "verify-email" }, "email skipped: provider not configured");
    return { skipped: true as const };
  }
  await sendMail({
    to,
    subject: "Verify your Witch email",
    html: verificationEmail({ url }),
  });
  return { skipped: false as const };
}

export async function sendPasswordResetEmail(to: string, url: string) {
  if (!emailEnabled()) {
    logger.info({ type: "password-reset" }, "email skipped: provider not configured");
    return { skipped: true as const };
  }
  await sendMail({
    to,
    subject: "Reset your Witch password",
    html: passwordResetEmail({ url }),
  });
  return { skipped: false as const };
}

export async function sendInvitationEmail(input: {
  to: string;
  organizationName: string;
  url: string;
  role: string;
}) {
  if (!emailEnabled()) {
    logger.info({ type: "invitation" }, "email skipped: provider not configured");
    return { skipped: true as const };
  }
  await sendMail({
    to: input.to,
    subject: `Invitation to ${input.organizationName} on Witch`,
    html: invitationEmail(input),
  });
  return { skipped: false as const };
}

export async function sendIncidentAlertEmail(input: {
  to: string;
  siteName: string;
  siteUrl: string;
  title: string;
  severity: string;
  detectedAt: string;
  summary: string;
  evidence: string[];
  incidentUrl: string;
}) {
  await sendMail({
    to: input.to,
    subject: `[${input.severity}] ${input.siteName}: ${input.title}`,
    html: incidentEmail(input),
  });
}

export async function sendRecoveryAlertEmail(input: {
  to: string;
  siteName: string;
  title: string;
  incidentUrl: string;
}) {
  await sendMail({
    to: input.to,
    subject: `Recovered: ${input.siteName} — ${input.title}`,
    html: recoveryEmail(input),
  });
}

export async function sendMonthlyReportEmail(input: {
  to: string;
  title: string;
  reportUrl: string;
}) {
  await sendMail({
    to: input.to,
    subject: input.title,
    html: monthlyReportEmail(input),
  });
}

export function emailFrom() {
  return getEnv().EMAIL_FROM;
}


export async function sendStatusSubscriptionConfirmationEmail(input: {
  to: string;
  organizationName: string;
  confirmUrl: string;
}) {
  if (!emailEnabled()) {
    throw new Error("Email delivery is not configured.");
  }
  await sendMail({
    to: input.to,
    subject: `Confirm status updates from ${input.organizationName}`,
    html: statusSubscriptionConfirmationEmail(input),
  });
}

export async function sendStatusIncidentSubscriberEmail(input: {
  to: string;
  organizationName: string;
  siteName: string;
  title: string;
  summary: string;
  statusUrl: string;
  unsubscribeUrl: string;
}) {
  await sendMail({
    to: input.to,
    subject: `Incident: ${input.siteName} · ${input.title}`,
    html: statusIncidentSubscriberEmail(input),
  });
}

export async function sendStatusRecoverySubscriberEmail(input: {
  to: string;
  organizationName: string;
  siteName: string;
  title: string;
  statusUrl: string;
  unsubscribeUrl: string;
}) {
  await sendMail({
    to: input.to,
    subject: `Recovered: ${input.siteName}`,
    html: statusRecoverySubscriberEmail(input),
  });
}
