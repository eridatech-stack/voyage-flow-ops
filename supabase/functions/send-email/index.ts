import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from_name?: string;
  reply_to?: string;
  resend_api_key: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject || !payload.body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.resend_api_key) {
      return new Response(
        JSON.stringify({ error: "No Resend API key configured. Add it in Settings → Email Configuration." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromName = payload.from_name || "InTravelSync";
    const fromEmail = "onboarding@resend.dev"; // Use verified domain in production

    // Convert plain text body to simple HTML
    const htmlBody = payload.body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1A2744; padding: 28px 32px; display: flex; align-items: center; gap: 16px; }
    .logo-box { width: 44px; height: 44px; background: #F59E0B; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #1A2744; }
    .header-text { color: white; }
    .header-text h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .header-text p { margin: 2px 0 0; font-size: 12px; opacity: 0.6; }
    .body { padding: 32px; color: #334155; font-size: 15px; line-height: 1.7; }
    .footer { background: #f1f5f9; padding: 20px 32px; font-size: 12px; color: #94a3b8; text-align: center; }
    .footer a { color: #F59E0B; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-box">iT</div>
      <div class="header-text">
        <h1>${fromName}</h1>
        <p>Travel Operations</p>
      </div>
    </div>
    <div class="body">${htmlBody}</div>
    <div class="footer">
      This email was sent by ${fromName}. &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    const resendPayload: any = {
      from: `${fromName} <${fromEmail}>`,
      to: [payload.to],
      subject: payload.subject,
      html: emailHtml,
    };

    if (payload.reply_to) {
      resendPayload.reply_to = payload.reply_to;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${payload.resend_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: result.message ?? "Failed to send email" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
