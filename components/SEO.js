import Head from 'next/head';
import { seo, brand } from '../config/brand';

export default function SEO({
  title,
  description,
  image,
  url,
  article = false,
  noindex = false
}) {
  const pageTitle = title 
    ? `${title} | ${brand.name}` 
    : seo.defaultTitle;
  
  const pageDescription = description || seo.defaultDescription;
  const pageUrl = url || brand.url;
  const pageImage = image 
    ? `${brand.url}${image}` 
    : `${brand.url}${brand.ogImage}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={brand.keywords.join(', ')} />
      <meta name="author" content={brand.name} />
      
      {/* Viewport & Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content={brand.colors.primary} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={brand.name} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:creator" content={seo.twitter.handle} />
      <meta name="twitter:site" content={seo.twitter.site} />
      
      {/* Additional SEO */}
      <meta name="application-name" content={brand.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={brand.name} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: brand.name,
            description: pageDescription,
            url: brand.url,
            applicationCategory: 'BusinessApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free tier with 50 credits'
            },
            operatingSystem: 'Web Browser',
            featureList: brand.features.map(f => f.title).join(', ')
          })
        }}
      />
    </Head>
  );
}

