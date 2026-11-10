const VIDEO_SOURCE_KEY = 'video_source';
const DEFAULT_VIDEO = { platform: 'vk', channel: 'numeatest' };

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

function parseVideoSource(value) {
  if (typeof value !== 'string') return DEFAULT_VIDEO;
  const trimmedValue = value.trim();
  const okUrlMatch = /^(?:ok:)?https?:\/\/(?:www\.|m\.)?ok\.ru\/(?:video|videoembed|live)\/(\d+)(?:[/?#].*)?$/i.exec(trimmedValue);
  if (okUrlMatch) return { platform: 'ok', channel: okUrlMatch[1] };

  const match = /^(vk|twitch|youtube|yt|drive|ok):([a-z0-9_-]{1,200})$/i.exec(trimmedValue);
  if (!match) return DEFAULT_VIDEO;

  const requestedPlatform = match[1].toLowerCase();
  const platform = requestedPlatform === 'yt' ? 'youtube' : requestedPlatform;
  const identifier = match[2];
  if (platform === 'vk' && !/^[a-z0-9_-]{1,64}$/i.test(identifier)) return DEFAULT_VIDEO;
  if (platform === 'twitch' && !/^[a-z0-9_]{1,25}$/i.test(identifier)) return DEFAULT_VIDEO;
  if (platform === 'youtube' && !/^[a-zA-Z0-9_-]{11}$/.test(identifier)) return DEFAULT_VIDEO;
  if (platform === 'drive' && !/^[a-zA-Z0-9_-]{10,200}$/.test(identifier)) return DEFAULT_VIDEO;
  if (platform === 'ok' && !/^\d{1,20}$/.test(identifier)) return DEFAULT_VIDEO;
  const channel = platform === 'youtube' || platform === 'drive'
    ? identifier
    : platform === 'ok' ? identifier : identifier.toLowerCase();
  return { platform, channel };
}

export async function onRequestGet({ request, env }) {
  let video = DEFAULT_VIDEO;
  let maintenance = false;
  let brandName = 'HoliSofi';
  try {
    video = parseVideoSource(await env.TWITCH_CHANNEL_CONFIG?.get(VIDEO_SOURCE_KEY));
  } catch {}
  try {
    const siteMode = (await env.TWITCH_CHANNEL_CONFIG?.get('site_mode'))?.trim().toLowerCase();
    maintenance = siteMode === 'offline';
  } catch {}
  try {
    const configuredBrand = (await env.TWITCH_CHANNEL_CONFIG?.get('brand_name'))?.trim();
    if (configuredBrand) brandName = configuredBrand.slice(0, 40);
  } catch {}

  let embedUrl;
  if (video.platform === 'twitch') {
    embedUrl = `https://player.twitch.tv/?channel=${encodeURIComponent(video.channel)}&parent=${encodeURIComponent(new URL(request.url).hostname)}`;
  } else if (video.platform === 'youtube') {
    embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.channel)}?playsinline=1`;
  } else if (video.platform === 'drive') {
    embedUrl = `https://drive.google.com/file/d/${encodeURIComponent(video.channel)}/preview`;
  } else if (video.platform === 'ok') {
    embedUrl = `https://ok.ru/videoembed/${encodeURIComponent(video.channel)}`;
  } else {
    embedUrl = `https://live.vkvideo.ru/app/embed/${encodeURIComponent(video.channel)}`;
  }

  return json({ videoPlatform: video.platform, videoChannel: video.channel, videoEmbedUrl: embedUrl, maintenance, brandName });
}
