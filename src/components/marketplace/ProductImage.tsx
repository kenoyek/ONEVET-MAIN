import { useState } from 'react';
import { ProductImageFallback } from './ProductImageFallback';

export function ProductImage({ src, title, category, className, loading }: { src?: string | null; title: string; category?: string | null; className?: string; loading?: 'lazy' | 'eager' }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <ProductImageFallback title={title} category={category} />;
  return <img src={src} alt={title} className={className} loading={loading} onError={() => setFailed(src)} />;
}
