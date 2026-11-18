// Album data comes from content.js (edited with the admin app). This module only adds helpers.
// Photo ids are the URL-safe file names in assets/img (see js/data/meta.js).
import content from './content.js';

export const photos = content.photos;
export const albums = content.albums;
export const albumBySlug = Object.fromEntries(albums.map((a) => [a.slug, a]));

export function photoIds(album) {
  const set = new Set([album.cover]);
  for (const b of album.blocks) {
    if (b.id) set.add(b.id);
    if (b.ids) b.ids.forEach((i) => set.add(i));
  }
  return [...set];
}
