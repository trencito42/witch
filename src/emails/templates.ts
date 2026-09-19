function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const p = 'style="margin:0 0 14px;line-height:1.55;color:#d4d4d8;font-size:14px;"';
const a = 'style="color:#b7e4c7;text-decoration:none;"';

export function welcomeEmail(input: { name: string; appUrl: string }) {
  return `<p ${p}>Hello ${escapeHtml(input.name)},</p>
<p ${p}>Your Witch workspace is ready. Add a site to start HTTP monitoring. Visual baselines start on Freelancer and above.</p>
<p ${p}><a ${a} href="${escapeHtml(input.appUrl)}/overview">Open Witch</a></p>`;
}

export function verificationEmail(input: { url: string }) {
  return `<p ${p}>Confirm this email address to finish setting up your Witch account.</p>
<p ${p}><a ${a} href="${escapeHtml(input.url)}">Verify email</a></p>
<p ${p}>If you did not create an account, you can ignore this message.</p>`;
}

export function passwordResetEmail(input: { url: string }) {
  return `<p ${p}>A password reset was requested for your Witch account.</p>
<p ${p}><a ${a} href="${escapeHtml(input.url)}">Choose a new password</a></p>
<p ${p}>If you did not request this, you can ignore this message.</p>`;
}

export function invitationEmail(input: {
  organizationName: string;
  url: string;
  role: string;
}) {
  return `<p ${p}>You were invited to join ${escapeHtml(input.organizationName)} on Witch as ${escapeHtml(input.role.toLowerCase())}.</p>
<p ${p}><a ${a} href="${escapeHtml(input.url)}">Accept invitation</a></p>`;
}

export function incidentEmail(input: {
  siteName: string;
  siteUrl: string;
  title: string;
  severity: string;
  detectedAt: string;
  summary: string;
  evidence: string[];
  incidentUrl: string;
}) {
  const evidence = input.evidence
    .slice(0, 8)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<p ${p}><strong style="color:#ececec;">${escapeHtml(input.siteName)}</strong> · ${escapeHtml(input.severity)}</p>
<p ${p}>${escapeHtml(input.title)}</p>
<p ${p}>Detected ${escapeHtml(input.detectedAt)} · ${escapeHtml(input.siteUrl)}</p>
<p ${p}>${escapeHtml(input.summary)}</p>
${evidence ? `<ul style="color:#d4d4d8;font-size:14px;">${evidence}</ul>` : ""}
<p ${p}><a ${a} href="${escapeHtml(input.incidentUrl)}">View incident</a></p>`;
}

export function recoveryEmail(input: {
  siteName: string;
  title: string;
  incidentUrl: string;
}) {
  return `<p ${p}>${escapeHtml(input.siteName)} recovered from “${escapeHtml(input.title)}”.</p>
<p ${p}><a ${a} href="${escapeHtml(input.incidentUrl)}">View incident</a></p>`;
}

export function monthlyReportEmail(input: { title: string; reportUrl: string }) {
  return `<p ${p}>${escapeHtml(input.title)} is ready.</p>
<p ${p}><a ${a} href="${escapeHtml(input.reportUrl)}">Open report</a></p>`;
}


export function statusSubscriptionConfirmationEmail(input: {
  organizationName: string;
  confirmUrl: string;
}) {
  return `<p ${p}>Confirm your subscription to status updates from <strong style="color:#ececec;">${escapeHtml(input.organizationName)}</strong>.</p>
<p ${p}><a ${a} href="${escapeHtml(input.confirmUrl)}">Confirm status updates</a></p>
<p ${p}>If you did not request this, you can ignore this message.</p>`;
}

export function statusIncidentSubscriberEmail(input: {
  organizationName: string;
  siteName: string;
  title: string;
  summary: string;
  statusUrl: string;
  unsubscribeUrl: string;
}) {
  return `<p ${p}><strong style="color:#ececec;">${escapeHtml(input.organizationName)}</strong> reported an incident.</p>
<p ${p}><strong style="color:#ececec;">${escapeHtml(input.siteName)}</strong> · ${escapeHtml(input.title)}</p>
<p ${p}>${escapeHtml(input.summary)}</p>
<p ${p}><a ${a} href="${escapeHtml(input.statusUrl)}">View public status</a></p>
<p ${p} style="font-size:12px;color:#71717a;"><a ${a} href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe from these updates</a></p>`;
}

export function statusRecoverySubscriberEmail(input: {
  organizationName: string;
  siteName: string;
  title: string;
  statusUrl: string;
  unsubscribeUrl: string;
}) {
  return `<p ${p}><strong style="color:#ececec;">${escapeHtml(input.organizationName)}</strong> reported a recovery.</p>
<p ${p}>${escapeHtml(input.siteName)} recovered from “${escapeHtml(input.title)}”.</p>
<p ${p}><a ${a} href="${escapeHtml(input.statusUrl)}">View public status</a></p>
<p ${p} style="font-size:12px;color:#71717a;"><a ${a} href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe from these updates</a></p>`;
}
