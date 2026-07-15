const URL_REGEX = /https?:\/\/[^\s<>"')]+/i;

export interface LinkPreview {
  [key: string]: string | null;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

// Best-effort OpenGraph scrape of the first URL in a message body.
// Fails silently — a message must never be blocked by a broken preview.
export async function buildLinkPreview(text?: string | null): Promise<LinkPreview | null> {
  if (!text) {
    return null;
  }

  const match = text.match(URL_REGEX);
  if (!match) {
    return null;
  }

  const url = match[0];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; LumenPreview/1.0)',
        accept: 'text/html',
      },
    });
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/html')) {
      return null;
    }

    const html = (await response.text()).slice(0, 300_000);

    const pickMeta = (prop: string): string | null => {
      const forward = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
        'i'
      );
      const backward = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
        'i'
      );
      return html.match(forward)?.[1] || html.match(backward)?.[1] || null;
    };

    const title = pickMeta('og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
    const description = pickMeta('og:description') || pickMeta('description');
    const image = pickMeta('og:image');
    const siteName = pickMeta('og:site_name');

    if (!title && !description) {
      return null;
    }

    return { url, title, description, image, siteName };
  } catch {
    return null;
  }
}
