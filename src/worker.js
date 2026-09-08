import { handleAuth } from "./auth.js";

const KEY_RE = /^[A-Za-z0-9:_-]{1,64}$/;
const LOCATION_TTL_SECONDS = 90; // covers gaps between watchPosition updates; doubles as auto-stop if sharing stops without hitting DELETE

function isValidCoord(lat, lon) {
  return (
    typeof lat === "number" && isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lon === "number" && isFinite(lon) && lon >= -180 && lon <= 180
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/login") {
      const authResponse = await handleAuth(request, env);
      if (authResponse) return authResponse;
    } else {
      return handleAuth(request, env);
    }

    if (url.pathname === "/api/location") {
      const key = url.searchParams.get("key") || "";

      if (request.method === "GET") {
        if (!KEY_RE.test(key)) return new Response("Bad key", { status: 400 });
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
        if (!body || !KEY_RE.test(body.key) || !isValidCoord(body.lat, body.lon)) {
          return new Response("Bad request", { status: 400 });
        }
        const value = JSON.stringify({ lat: body.lat, lon: body.lon, ts: Date.now() });
        await env.WEEKS_KV.put(body.key, value, { expirationTtl: LOCATION_TTL_SECONDS });
        return Response.json({ ok: true });
      }

      if (request.method === "DELETE") {
        if (!KEY_RE.test(key)) return new Response("Bad key", { status: 400 });
        await env.WEEKS_KV.delete(key);
        return Response.json({ ok: true });
      }

      return new Response("Method not allowed", { status: 405 });
    }

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
