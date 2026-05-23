/**
 * emailService.js
 *
 * Resend-based transactional email service for Split.ly.
 *
 * Usage:
 *   import { sendEmail, emailTemplates } from './emailService.js';
 *   await sendEmail(emailTemplates.settlementRequested({ ... }));
 *
 * All send calls are fire-and-forget — they never throw into the caller so a
 * failed email never blocks an API response. Errors are logged instead.
 *
 * Environment variables required:
 *   RESEND_API_KEY — from resend.com dashboard
 *   SMTP_FROM_NAME — display name (default: "Split.ly")
 *   APP_URL        — frontend base URL (default: http://localhost:5173)
 */

import { Resend } from 'resend';

/* ── Client ──────────────────────────────────────────────────────────────── */

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_NAME = process.env.SMTP_FROM_NAME || 'Split.ly';
// Use your verified Resend domain here once set up.
// Until then, onboarding@resend.dev works but only sends to your own email.
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'onboarding@resend.dev';
const FROM = `${FROM_NAME} <${FROM_ADDRESS}>`;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/* ── Core send helper ────────────────────────────────────────────────────── */

/**
 * Fire-and-forget email send.
 * @param {{ to: string, subject: string, html: string }} options
 */
export const sendEmail = async (options) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[email] skipped (RESEND_API_KEY not configured) → ${options.subject} → ${options.to}`);
        return;
    }
    try {
        await resend.emails.send({
            from:    FROM,
            to:      options.to,
            subject: options.subject,
            html:    options.html,
        });
        console.log(`[email] sent → ${options.subject} → ${options.to}`);
    } catch (err) {
        // Never throw — a broken email must never break an API response
        console.error(`[email] FAILED → ${options.subject} → ${options.to}`, err.message);
    }
};

/* ── Shared HTML layout ──────────────────────────────────────────────────── */

const layout = (bodyHtml, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Split.ly</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6c47ff 0%, #9f77ff 100%); padding: 32px 36px 28px; }
    .header-logo { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header-logo span { opacity: 0.65; font-weight: 500; }
    .body { padding: 32px 36px; }
    .greeting { font-size: 15px; color: #555; margin-bottom: 20px; }
    .card { background: #f7f5ff; border: 1.5px solid #e8e0ff; border-radius: 14px; padding: 22px 24px; margin: 24px 0; }
    .card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9f77ff; margin-bottom: 6px; }
    .card-amount { font-size: 36px; font-weight: 900; color: #6c47ff; letter-spacing: -1px; margin-bottom: 4px; }
    .card-meta { font-size: 13px; color: #777; font-weight: 500; }
    .card-meta strong { color: #1a1a2e; }
    .arrow-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .pill { display: inline-block; background: #ede8ff; color: #6c47ff; border-radius: 8px; padding: 5px 12px; font-size: 13px; font-weight: 700; }
    .pill-green { background: #e6f9f0; color: #15803d; }
    .pill-red   { background: #fff0f0; color: #dc2626; }
    .pill-grey  { background: #f1f1f1; color: #555; }
    .arrow { font-size: 16px; color: #bbb; }
    .cta-btn { display: inline-block; margin-top: 24px; background: linear-gradient(135deg, #6c47ff 0%, #9f77ff 100%); color: #fff; text-decoration: none; padding: 13px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; }
    .message { font-size: 14px; color: #444; line-height: 1.7; margin-top: 8px; }
    .divider { border: none; border-top: 1.5px solid #f0eeff; margin: 24px 0; }
    .expense-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .expense-item { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .expense-item-name { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .expense-item-amt  { font-size: 14px; font-weight: 800; color: #6c47ff; }
    .footer { background: #fafafa; border-top: 1.5px solid #f0eeff; padding: 20px 36px; font-size: 11px; color: #aaa; text-align: center; line-height: 1.6; }
    .footer a { color: #9f77ff; text-decoration: none; }
    @media (max-width: 600px) {
      .wrapper { margin: 0; border-radius: 0; }
      .body, .header, .footer { padding-left: 20px; padding-right: 20px; }
      .card-amount { font-size: 28px; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#fff;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">Split<span>.ly</span></div>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      You're receiving this because you're a member of a Split.ly group.<br/>
      <a href="${APP_URL}">Open Split.ly</a> · Questions? Reply to this email.
    </div>
  </div>
</body>
</html>`;

/* ── Template helpers ────────────────────────────────────────────────────── */

const fmtAmount = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Email templates ─────────────────────────────────────────────────────── */

export const emailTemplates = {

    /* ── 1. Settlement requested (debtor → creditor) ─────────────────────── */
    settlementRequested({ toEmail, toName, fromName, amount, groupName, groupId }) {
        const appLink = `${APP_URL}/groups/${groupId}`;
        return {
            to:      toEmail,
            subject: `💸 ${fromName} wants to settle up with you in ${groupName}`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    <strong>${fromName}</strong> has marked a payment as sent to you and
                    is requesting your confirmation to close this balance.
                </p>
                <div class="card">
                    <div class="card-label">Incoming payment</div>
                    <div class="card-amount">${fmtAmount(amount)}</div>
                    <div class="card-meta">Group: <strong>${groupName}</strong></div>
                    <div class="arrow-row">
                        <span class="pill">${fromName}</span>
                        <span class="arrow">→</span>
                        <span class="pill pill-green">You</span>
                    </div>
                </div>
                <p class="message">
                    Please confirm only if you have <strong>actually received ${fmtAmount(amount)}</strong>.
                    Once you confirm, this settlement will be permanently recorded.
                </p>
                <a class="cta-btn" href="${appLink}">Confirm in Split.ly →</a>
                <hr class="divider" />
                <p class="message" style="font-size:12px;color:#aaa;">
                    If you haven't received anything, just ignore this email or open the app to cancel the request.
                </p>
            `, `${fromName} sent you ${fmtAmount(amount)} — confirm receipt in Split.ly`),
        };
    },

    /* ── 2. Settlement confirmed (creditor → debtor) ─────────────────────── */
    settlementConfirmed({ toEmail, toName, confirmedByName, amount, groupName, groupId }) {
        const appLink = `${APP_URL}/groups/${groupId}`;
        return {
            to:      toEmail,
            subject: `✅ ${confirmedByName} confirmed your payment of ${fmtAmount(amount)} in ${groupName}`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    Good news! <strong>${confirmedByName}</strong> has confirmed that they received your
                    payment. The balance has been cleared and recorded.
                </p>
                <div class="card">
                    <div class="card-label">Settlement confirmed</div>
                    <div class="card-amount">${fmtAmount(amount)}</div>
                    <div class="card-meta">Group: <strong>${groupName}</strong></div>
                    <div class="arrow-row">
                        <span class="pill">You</span>
                        <span class="arrow">→</span>
                        <span class="pill pill-green">${confirmedByName}</span>
                        <span class="pill pill-green" style="margin-left:4px;">✓ Confirmed</span>
                    </div>
                </div>
                <a class="cta-btn" href="${appLink}">View in Split.ly →</a>
            `, `${confirmedByName} confirmed your ₹${amount} payment — you're all settled!`),
        };
    },

    /* ── 3. Settlement cancelled (either party → the other) ─────────────── */
    settlementCancelled({ toEmail, toName, cancelledByName, amount, groupName, groupId }) {
        const appLink = `${APP_URL}/groups/${groupId}`;
        return {
            to:      toEmail,
            subject: `❌ Settlement request cancelled in ${groupName}`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    The pending settlement of <strong>${fmtAmount(amount)}</strong> in
                    <strong>${groupName}</strong> was cancelled by <strong>${cancelledByName}</strong>.
                    The balance remains open.
                </p>
                <div class="card">
                    <div class="card-label">Cancelled settlement</div>
                    <div class="card-amount" style="color:#dc2626;">${fmtAmount(amount)}</div>
                    <div class="card-meta">Group: <strong>${groupName}</strong></div>
                    <div class="arrow-row">
                        <span class="pill pill-red">Cancelled by ${cancelledByName}</span>
                    </div>
                </div>
                <p class="message">No action needed — you can initiate a new settlement whenever you're ready.</p>
                <a class="cta-btn" href="${appLink}">View balances →</a>
            `, `Settlement of ${fmtAmount(amount)} in ${groupName} was cancelled`),
        };
    },

    /* ── 4. New expense added (payer → all other participants) ───────────── */
    expenseAdded({ toEmail, toName, payerName, description, totalAmount, yourShare, groupName, groupId, splitType }) {
        const appLink  = `${APP_URL}/groups/${groupId}`;
        const isCustom = splitType === 'custom';
        return {
            to:      toEmail,
            subject: `🧾 ${payerName} added "${description}" (${fmtAmount(totalAmount)}) in ${groupName}`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    <strong>${payerName}</strong> added a new expense to
                    <strong>${groupName}</strong> that includes you.
                </p>
                <div class="card">
                    <div class="card-label">New expense</div>
                    <div class="card-amount">${fmtAmount(totalAmount)}</div>
                    <div class="card-meta">
                        <strong>${description}</strong> · paid by ${payerName}
                        ${isCustom ? ' · custom split' : ''}
                    </div>
                    <div class="arrow-row" style="margin-top:16px;">
                        <span style="font-size:12px;color:#777;font-weight:600;">Your share</span>
                        <span class="pill pill-red">${fmtAmount(yourShare)}</span>
                    </div>
                </div>
                <a class="cta-btn" href="${appLink}">View expense →</a>
            `, `You owe ${fmtAmount(yourShare)} for "${description}" in ${groupName}`),
        };
    },

    /* ── 5. Expense deleted (payer → all other participants) ─────────────── */
    expenseDeleted({ toEmail, toName, payerName, description, totalAmount, yourShare, groupName, groupId }) {
        const appLink = `${APP_URL}/groups/${groupId}`;
        return {
            to:      toEmail,
            subject: `🗑️ "${description}" was removed from ${groupName}`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    <strong>${payerName}</strong> removed the expense
                    "<strong>${description}</strong>" from <strong>${groupName}</strong>.
                    Your balance has been updated accordingly.
                </p>
                <div class="card">
                    <div class="card-label">Removed expense</div>
                    <div class="card-amount" style="color:#dc2626;text-decoration:line-through;">${fmtAmount(totalAmount)}</div>
                    <div class="card-meta">Your share of <strong>${fmtAmount(yourShare)}</strong> has been cleared.</div>
                </div>
                <a class="cta-btn" href="${appLink}">View updated balances →</a>
            `, `"${description}" (your share ${fmtAmount(yourShare)}) was removed from ${groupName}`),
        };
    },

    /* ── 6. Added to a group (new member notification) ───────────────────── */
    addedToGroup({ toEmail, toName, addedByName, groupName, groupCode, groupId }) {
        const appLink = `${APP_URL}/groups/${groupId}`;
        return {
            to:      toEmail,
            subject: `👋 You joined ${groupName} on Split.ly`,
            html: layout(`
                <p class="greeting">Hi <strong>${toName}</strong>,</p>
                <p class="message">
                    You've successfully joined <strong>${groupName}</strong>
                    ${addedByName ? ` (invited by <strong>${addedByName}</strong>)` : ''}.
                    You can now view expenses, add your own, and track who owes what.
                </p>
                <div class="card">
                    <div class="card-label">Group details</div>
                    <div class="card-amount" style="font-size:24px;">${groupName}</div>
                    <div class="card-meta" style="margin-top:10px;">
                        Invite code: <strong style="letter-spacing:3px;">${groupCode}</strong>
                    </div>
                </div>
                <a class="cta-btn" href="${appLink}">Open group →</a>
            `, `You joined ${groupName} on Split.ly`),
        };
    },
};