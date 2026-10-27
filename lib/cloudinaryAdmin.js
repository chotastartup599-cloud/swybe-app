// Cloudinary se files hatane ke liye (server par hi chalta hai).
// CLOUDINARY_API_KEY aur CLOUDINARY_API_SECRET Vercel env me hone chahiye (NEXT_PUBLIC ke bina!).
// Keys na hon to ye chupchaap skip ho jata hai, app nahi tootti.

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'okuevkuf';

// "https://res.cloudinary.com/<cloud>/video/upload/v123/abc.mp4" se resource type aur public id nikalta hai
export function parseCloudinaryUrl(url) {
  if (typeof url !== 'string') return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;

  const parts = parsed.pathname.split('/').filter(Boolean); // [cloud, resource_type, type, ...baaki]
  if (parts.length < 4) return null;

  const [cloud, resourceType, type, ...rest] = parts;
  if (cloud !== CLOUD_NAME || type !== 'upload') return null;
  if (!['image', 'video', 'raw'].includes(resourceType)) return null;

  // Version ("v123456") ke baad ka hissa hi public id hai
  const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
  const idParts = versionIndex >= 0 ? rest.slice(versionIndex + 1) : rest;
  if (idParts.length === 0) return null;

  const last = idParts[idParts.length - 1].replace(/\.[A-Za-z0-9]+$/, '');
  let publicId;
  try {
    publicId = decodeURIComponent([...idParts.slice(0, -1), last].join('/'));
  } catch {
    return null;
  }

  return { resourceType, publicId };
}

// Best-effort: kuch fail ho to error log hota hai, par kabhi throw nahi karta
export async function deleteCloudinaryMedia(urls) {
  try {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn('Cloudinary delete skipped: CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET set nahi hain.');
      return;
    }

    const groups = new Map();
    for (const url of new Set((urls || []).filter(Boolean))) {
      const item = parseCloudinaryUrl(url);
      if (!item) continue;
      if (!groups.has(item.resourceType)) groups.set(item.resourceType, new Set());
      groups.get(item.resourceType).add(item.publicId);
    }
    if (groups.size === 0) return;

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

    for (const [resourceType, idSet] of groups) {
      const ids = [...idSet];

      // Cloudinary ek call me max 100 files hatata hai
      for (let i = 0; i < ids.length; i += 100) {
        const query = ids
          .slice(i, i + 100)
          .map((id) => `public_ids[]=${encodeURIComponent(id)}`)
          .join('&');

        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${resourceType}/upload?${query}`,
            { method: 'DELETE', headers: { Authorization: authHeader } }
          );
          if (!res.ok) {
            console.error('Cloudinary delete failed:', res.status, await res.text().catch(() => ''));
          }
        } catch (error) {
          console.error('Cloudinary delete error:', error);
        }
      }
    }
  } catch (error) {
    console.error('deleteCloudinaryMedia error:', error);
  }
}