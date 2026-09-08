const COOKIE_NAME = "nogomet_auth";
const PEPPER = "nogomet-prevozi-pin-v1";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function loginPage(showError) {
  return `<!doctype html>
<html lang="sl"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Prevozi na nogomet</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#EAF3F8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  form{background:#FCFEFF;border:1px solid #CFE0EA;padding:28px 24px;width:100%;max-width:320px;box-sizing:border-box;}
  h1{font-size:18px;margin:0 0 16px;color:#033765;}
  input{width:100%;box-sizing:border-box;padding:12px;font-size:18px;border:1px solid #CFE0EA;margin-bottom:12px;letter-spacing:0.1em;text-align:center;font-family:inherit;}
  button{width:100%;padding:12px;background:#03619F;color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;}
  .err{color:#B3462C;font-size:13px;margin:-4px 0 12px;}
</style></head>
<body>
  <form method="POST" action="/login">
    <h1>Prevozi na nogomet</h1>
    ${showError ? `<div class="err">Napačen PIN, poskusi znova.</div>` : ""}
    <input type="password" inputmode="numeric" name="pin" placeholder="PIN" autofocus required>
    <button type="submit">Vstopi</button>
  </form>
</body></html>`;
}

function loginResponse(showError) {
  return new Response(loginPage(showError), {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function handleAuth(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData();
    const pin = (form.get("pin") || "").toString();
    if (pin && pin === env.ACCESS_PIN) {
      const token = await sha256Hex(env.ACCESS_PIN + ":" + PEPPER);
      const secure = url.protocol === "https:" ? "; Secure" : "";
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; Max-Age=${60*60*24*30}; HttpOnly; SameSite=Lax${secure}`,
        },
      });
    }
    return loginResponse(true);
  }

  if (!env.ACCESS_PIN) return null; // no PIN configured: gate disabled (e.g. local dev)

  const cookie = getCookie(request, COOKIE_NAME);
  const expected = await sha256Hex(env.ACCESS_PIN + ":" + PEPPER);
  if (cookie === expected) return null;

  return loginResponse(false);
}
