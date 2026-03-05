import type { InviteRole } from "@/lib/invite-service";

type SendSheetInviteEmailArgs = {
  to: string;
  sheetName: string;
  inviterEmail: string;
  role: InviteRole;
  inviteUrl: string;
};

export async function sendSheetInviteEmail(args: SendSheetInviteEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or EMAIL_FROM");
  }

  const subject = `You've been invited to "${args.sheetName}" on Gastos Tracker`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Sheet Invitation</h2>
      <p><strong>${args.inviterEmail}</strong> invited you to join <strong>${args.sheetName}</strong> as <strong>${args.role}</strong>.</p>
      <p>
        <a href="${args.inviteUrl}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Open Invite</a>
      </p>
      <p>If the button doesn't work, open this link:</p>
      <p><a href="${args.inviteUrl}">${args.inviteUrl}</a></p>
      <p>This invite expires in 7 days.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send invite email: ${errorBody}`);
  }
}
