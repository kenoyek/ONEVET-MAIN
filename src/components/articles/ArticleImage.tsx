const covers: Record<string, string> = {
  'poultry-morning-flock': 'Brown hens exploring fresh bedding in an airy poultry shelter at sunrise',
  'pet-enrichment': 'A dog investigating a food puzzle while a cat rests on a nearby perch',
};

export function ArticleImage({ src, alt, className, priority = false, sizes = '100vw' }: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  // Serve our managed covers from the current site on previews and www too.
  const local = src.replace(/^https:\/\/1vet\.store(?=\/images\/articles\/)/, '');
  const name = local.match(/^\/images\/articles\/([a-z-]+)\.webp$/)?.[1];
  const managed = name && covers[name];
  return <img
    src={managed ? local : src}
    srcSet={managed ? `${local.replace('.webp', '-700.webp')} 700w, ${local} 1400w` : undefined}
    sizes={managed ? sizes : undefined}
    alt={managed || alt}
    width={managed ? 1400 : undefined}
    height={managed ? 933 : undefined}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
    decoding="async"
    className={className}
  />;
}
