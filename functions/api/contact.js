const CONTACT_TO = "murungimugabealex@gmail.com";
const FROM = "Mugabe Alex Portfolio <onboarding@resend.dev>";
const MAX = { name: 100, email: 200, message: 5000 };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function readPayload(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return await request.json();
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  let data;
  try {
    data = await readPayload(request);
  } catch {
    return json({ error: "Could not read the submitted form." }, 400);
  }

  // Honeypot: real visitors never fill this hidden field.
  if (clean(data.company)) {
    return json({ ok: true });
  }

  const name = clean(data.name);
  const email = clean(data.email);
  const message = clean(data.message);

  if (!name || name.length > MAX.name) {
    return json({ error: "Please provide your name (100 characters max)." }, 422);
  }
  if (!email || email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please provide a valid email address." }, 422);
  }
  if (!message || message.length < 10 || message.length > MAX.message) {
    return json({ error: "Your message should be between 10 and 5000 characters." }, 422);
  }

  if (!env.RESEND_API_KEY) {
    return json(
      { error: "The email service is not configured yet. Please use WhatsApp or email instead." },
      503
    );
  }

  const subject = `Portfolio message from ${name}`;
  const text = [
    `New message from your portfolio`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    ``,
    message
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;color:#1E2A24">
      <h2 style="margin:0 0 16px;color:#1B4332">New portfolio message</h2>
      <p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 16px"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM,
      to: [env.CONTACT_TO || CONTACT_TO],
      reply_to: email,
      subject,
      text,
      html
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend error", res.status, detail);
    return json({ error: "The message could not be sent right now. Please try WhatsApp or email." }, 502);
  }

  return json({ ok: true });
}
