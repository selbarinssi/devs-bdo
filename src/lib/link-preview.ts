/** Client-side link previews (oEmbed / noembed). No API keys required. */

export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
  embedHtml: string | null;
  provider: string | null;
};

const URL_RE = /https?:\/\/[^\s<>\[\]()"']+/gi;

export function extractUrls(text: string): string[] {
  const found = text.match(URL_RE) ?? [];
  const cleaned = found.map((u) => u.replace(/[.,);:]+$/, ""));
  return [...new Set(cleaned)].slice(0, 3);
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/embed/")[1]?.split("/")[0] || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const base: LinkPreview = {
    url,
    title: null,
    description: null,
    image: null,
    site: null,
    embedHtml: null,
    provider: null,
  };

  const yt = youtubeId(url);
  if (yt) {
    const data = await fetchJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    if (data) {
      return {
        ...base,
        title: String(data.title ?? ""),
        image: String(data.thumbnail_url ?? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`),
        site: "YouTube",
        provider: "youtube",
        embedHtml: null,
      };
    }
  }

  if (/open\.spotify\.com\//i.test(url)) {
    const data = await fetchJson(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
    );
    if (data) {
      return {
        ...base,
        title: String(data.title ?? ""),
        image: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
        site: "Spotify",
        provider: "spotify",
        embedHtml: typeof data.html === "string" ? data.html : null,
      };
    }
  }

  const noembed = await fetchJson(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
  if (noembed && !noembed.error) {
    return {
      ...base,
      title: noembed.title != null ? String(noembed.title) : null,
      description: null,
      image: typeof noembed.thumbnail_url === "string" ? noembed.thumbnail_url : null,
      site: noembed.provider_name != null ? String(noembed.provider_name) : null,
      provider: noembed.provider_name != null ? String(noembed.provider_name) : "noembed",
      embedHtml: typeof noembed.html === "string" ? noembed.html : null,
    };
  }

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return { ...base, title: host, site: host, provider: "link" };
  } catch {
    return base;
  }
}

export async function fetchPreviewsForText(text: string): Promise<LinkPreview[]> {
  const urls = extractUrls(text);
  const out: LinkPreview[] = [];
  for (const u of urls) {
    out.push(await fetchLinkPreview(u));
  }
  return out;
}
