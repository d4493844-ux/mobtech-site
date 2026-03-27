import { useEffect } from 'react'

const SITE_URL = 'https://mobtechsynergies.com'
const DEFAULT_IMAGE = 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'

export default function SEO({ title, description, image, url, type = 'website', schema }) {
  const fullTitle = title
    ? `${title} | Mobtech Synergies Ltd`
    : 'Mobtech Synergies Ltd — Transforming Ideas Digital | Tech & Engineering Innovation Africa'

  const fullDesc = description ||
    'Mobtech Synergies Ltd is a Nigerian technology and engineering company building transformative systems — Gacom gaming platform, VMS virtual marketplace, and the Triangle Engine. Founded by Akinyemi Akinjide Samuel.'

  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const fullImage = image || DEFAULT_IMAGE

  useEffect(() => {
    // Title
    document.title = fullTitle

    const setMeta = (sel, val, attr = 'content') => {
      let el = document.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        const parts = sel.match(/\[([^=]+)="([^"]+)"\]/)
        if (parts) el.setAttribute(parts[1], parts[2])
        document.head.appendChild(el)
      }
      el.setAttribute(attr, val)
    }

    // Standard
    setMeta('meta[name="description"]', fullDesc)
    setMeta('meta[name="keywords"]', 'Mobtech Synergies, Mobtech Nigeria, Gacom gaming platform, VMS virtual market space, Triangle Engine, Akinyemi Akinjide Samuel, Nigerian tech startup, African technology company, software engineering Africa, digital transformation Nigeria, tech innovation Africa, gaming platform Africa, digital marketplace Nigeria')
    setMeta('meta[name="author"]', 'Akinyemi Akinjide Samuel')
    setMeta('meta[name="robots"]', 'index, follow, max-image-preview:large')
    setMeta('meta[name="theme-color"]', '#0B1E2D')

    // Open Graph
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', fullDesc)
    setMeta('meta[property="og:image"]', fullImage)
    setMeta('meta[property="og:url"]', fullUrl)
    setMeta('meta[property="og:type"]', type)
    setMeta('meta[property="og:site_name"]', 'Mobtech Synergies Ltd')
    setMeta('meta[property="og:locale"]', 'en_NG')

    // Twitter
    setMeta('meta[name="twitter:card"]', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', fullDesc)
    setMeta('meta[name="twitter:image"]', fullImage)
    setMeta('meta[name="twitter:site"]', '@mobtechng')
    setMeta('meta[name="twitter:creator"]', '@akinyemiakinjide')

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = fullUrl

    // JSON-LD schema
    let schemaEl = document.getElementById('jsonld-schema')
    if (!schemaEl) { schemaEl = document.createElement('script'); schemaEl.id = 'jsonld-schema'; schemaEl.type = 'application/ld+json'; document.head.appendChild(schemaEl) }
    schemaEl.textContent = JSON.stringify(schema || defaultSchema())
  }, [fullTitle, fullDesc, fullUrl, fullImage])

  return null
}

function defaultSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://mobtechsynergies.com/#organization',
        name: 'Mobtech Synergies Ltd',
        alternateName: 'Mobtech',
        url: 'https://mobtechsynergies.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
          width: 512, height: 512
        },
        description: 'Nigerian technology and engineering company building transformative digital systems across software, gaming, e-commerce, and mechanical engineering.',
        foundingDate: '2021',
        foundingLocation: { '@type': 'Place', name: 'Lagos, Nigeria' },
        founder: {
          '@type': 'Person',
          name: 'Akinyemi Akinjide Samuel',
          jobTitle: 'Founder & CEO',
          url: 'https://mobtechsynergies.com/#founder',
          image: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
          alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bells University of Technology' },
          knowsAbout: ['Software Engineering', 'Platform Engineering', 'Digital Entrepreneurship', 'Gaming Platforms', 'African Tech Innovation'],
          sameAs: ['https://www.linkedin.com/company/mobtech-synergies-ltd']
        },
        areaServed: ['Nigeria', 'Africa', 'Global'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Mobtech Products & Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Gacom', description: 'Global gaming community platform connecting gamers across continents with competitions, communities, and monetisation infrastructure.', applicationCategory: 'GameApplication' } },
            { '@type': 'Offer', itemOffered: { '@type': 'WebApplication', name: 'VMS — Virtual Market Space', description: 'Revolutionary digital marketplace removing physical barriers to trade with seamless buyer-seller interaction.' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Triangle Engine', description: 'Proprietary mechanical engine innovation for next-generation compact mobility systems.' } }
          ]
        },
        sameAs: ['https://www.linkedin.com/company/mobtech-synergies-ltd', 'https://www.mobtechsynergies.com']
      },
      {
        '@type': 'WebSite',
        '@id': 'https://mobtechsynergies.com/#website',
        url: 'https://mobtechsynergies.com',
        name: 'Mobtech Synergies Ltd',
        description: 'Transforming Ideas Digital — African tech and engineering innovation',
        publisher: { '@id': 'https://mobtechsynergies.com/#organization' },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://mobtechsynergies.com/blog?q={search_term_string}' }, 'query-input': 'required name=search_term_string' }
      },
      {
        '@type': 'Person',
        '@id': 'https://mobtechsynergies.com/#founder',
        name: 'Akinyemi Akinjide Samuel',
        givenName: 'Akinyemi',
        familyName: 'Akinjide',
        jobTitle: 'Founder & CEO',
        affiliation: { '@id': 'https://mobtechsynergies.com/#organization' },
        description: 'Nigerian tech entrepreneur, innovator, and founder of Mobtech Synergies Ltd. Self-built from Bells University of Technology, author of The Power of Debt and Business Models. Building transformative digital systems across Africa.',
        image: 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
        nationality: 'Nigerian',
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bells University of Technology' },
        hasCredential: [
          { '@type': 'EducationalOccupationalCredential', name: 'The Power of Debt — Author' },
          { '@type': 'EducationalOccupationalCredential', name: 'Business Models — Author' }
        ],
        knowsAbout: ['Software Development', 'Platform Engineering', 'Gaming Technology', 'Digital Marketplaces', 'Mechanical Engineering Innovation', 'African Tech Entrepreneurship'],
        sameAs: ['https://www.linkedin.com/company/mobtech-synergies-ltd']
      }
    ]
  }
}
