import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
}

export function SEO({
  title,
  description = "Connect with licensed veterinarians online, 24/7. Get expert pet care advice, book services, and access Nigeria's leading vet platform.",
  ogType = "website",
  ogImage = "/favicon.png",
  twitterCard = "summary_large_image",
}: SEOProps) {
  const fullTitle = title ? `${title} | 1Vet` : "1Vet - 24/7 Online Veterinary Care";

  useEffect(() => {
    document.title = fullTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }

    const ogTypeMeta = document.querySelector('meta[property="og:type"]');
    if (ogTypeMeta) {
      ogTypeMeta.setAttribute('content', ogType);
    }

    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta) {
      ogImageMeta.setAttribute('content', ogImage);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', fullTitle);
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute('content', description);
    }

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', ogImage);
    }
  }, [fullTitle, description, ogType, ogImage, twitterCard]);

  return null;
}
