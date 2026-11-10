/** Keep the first publication date when saving, unpublishing or republishing. */
export function articlePublicationState(publish: boolean, firstPublishedAt: string | null, now = () => new Date().toISOString()) {
  return {
    is_published: publish,
    published_at: firstPublishedAt || (publish ? now() : null),
  };
}
