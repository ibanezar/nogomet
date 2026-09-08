const KEY_RE = /^[A-Za-z0-9:_-]{1,64}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/week") {
      if (request.method === "GET") {
        const key = url.searchParams.get("key") || "";
        if (!KEY_RE.test(key)) {
          return new Response("Bad key", { status: 400 });
        }
        const value = await env.WEEKS_KV.get(key);
        return Response.json({ value });
      }

      if (request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (!body || !KEY_RE.test(body.key) || typeof body.value !== "string") {
          return new Response("Bad request", { status: 400 });
        }
        if (body.value.length > 100_000) {
          return new Response("Value too large", { status: 413 });
        }
        await env.WEEKS_KV.put(body.key, body.value);
        return Response.json({ ok: true });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
