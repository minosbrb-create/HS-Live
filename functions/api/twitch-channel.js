let appToken = '';
let appTokenExpiresAt = 0;
let pendingTokenRequest = null;
const pendingChannelRequests = new Map();
const CHANNEL_CONFIG_KEY = 'channel_login';
const DEFAULT_CHANNEL_LOGIN = 'holisofi';

function json(data, status = 200, cacheControl = 'no-store, max-age=0') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

async function getAppToken(env) {
  if (appToken && Date.now() < appTokenExpiresAt) return appToken;
  if (pendingTokenRequest) return pendingTokenRequest;

  pendingTokenRequest = (async () => {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    if (!response.ok) throw new Error('Twitch token request failed');
    const data = await response.json();
    if (typeof data.access_token !== 'string' || !data.access_token) {
      throw new Error('Twitch returned no app token');
    }
    appToken = data.access_token;
    appTokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in || 3600) - 120) * 1000;
    return appToken;
  })();

  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = null;
  }
}

async function helix(path, env, token) {
  const response = await fetch(`https://api.twitch.tv/helix/${path}`, {
    headers: {
      'Client-ID': env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Twitch channel request failed');
  return response.json();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  let channelLogin = DEFAULT_CHANNEL_LOGIN;
  try {
    const configuredLogin = await env.TWITCH_CHANNEL_CONFIG?.get(CHANNEL_CONFIG_KEY);
    if (typeof configuredLogin === 'string' && /^[a-zA-Z0-9_]{1,25}$/.test(configuredLogin.trim())) {
      channelLogin = configuredLogin.trim().toLowerCase();
    }
  } catch {}

  const cache = globalThis.caches?.default;
  const cacheKeyUrl = new URL(request.url);
  cacheKeyUrl.search = '';
  cacheKeyUrl.searchParams.set('channel', channelLogin);
  const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    } catch {}
  }

  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return json({ configured: false, channelLogin }, 503);
  }

  const pending = pendingChannelRequests.get(channelLogin);
  if (pending) return (await pending).clone();

  const refresh = (async () => {
    try {
      const token = await getAppToken(env);
      const users = await helix(`users?login=${encodeURIComponent(channelLogin)}`, env, token);
      const user = users.data?.[0];
      if (!user) return json({ configured: true, channelLogin, error: 'No se encontró el canal.' }, 404);

      const [channels, streams] = await Promise.all([
        helix(`channels?broadcaster_id=${encodeURIComponent(user.id)}`, env, token),
        helix(`streams?user_login=${encodeURIComponent(user.login)}`, env, token),
      ]);
      const channel = channels.data?.[0] || {};
      const stream = streams.data?.[0] || null;
      const result = json({
        configured: true,
        channelLogin,
        displayName: user.display_name || channelLogin,
        profileImageUrl: user.profile_image_url || '',
        description: user.description || '',
        isLive: Boolean(stream),
        title: stream?.title || channel.title || '',
        category: stream?.game_name || channel.game_name || '',
        viewerCount: stream ? stream.viewer_count : null,
      }, 200, 'public, max-age=45, stale-while-revalidate=60');

      if (cache) {
        try {
          await cache.put(cacheKey, result.clone());
        } catch {}
      }
      return result;
    } catch {
      return json({ configured: true, channelLogin, error: 'No se pudo consultar Twitch.' }, 502);
    }
  })();

  pendingChannelRequests.set(channelLogin, refresh);
  try {
    return (await refresh).clone();
  } finally {
    if (pendingChannelRequests.get(channelLogin) === refresh) {
      pendingChannelRequests.delete(channelLogin);
    }
  }
}
