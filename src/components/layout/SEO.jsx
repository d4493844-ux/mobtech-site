import { useEffect } from 'react'

const SITE_URL = 'https://mobtechsynergies.com'
const DEFAULT_IMAGE = 'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg'

export default function SEO({ title, description, image, url, type = 'website', schema }) {
  const fullTitle = title
    ? `${title} | Mobtech Synergies Ltd`
    : 'Mobtech Synergies Ltd — Transforming Ideas Digital | Tech & Engineering Innovation Africa'
  const fullDesc = description ||
    'Mobtech Synergies Ltd — Nigerian tech company founded by Akinyemi Akinjide Samuel. Building Gacom gaming platform, VMS virtual marketplace, and the Triangle Engine. Transforming ideas digital.'
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const fullImage = image || DEFAULT_IMAGE

  useEffect(() => {
    document.title = fullTitle
    const setMeta = (sel, val) => {
      let el = document.querySelector(sel)
      if (!el) {
        el = document.createElement('meta')
        const parts = sel.match(/\[([^=]+)="([^"]+)"\]/)
        if (parts) el.setAttribute(parts[1], parts[2])
        document.head.appendChild(el)
      }
      el.setAttribute('content', val)
    }
    setMeta('meta[name="description"]', fullDesc)
    setMeta('meta[name="keywords"]', 'Mobtech Synergies, Akinyemi Akinjide Samuel, Akinyemi Akinjide, Gacom gaming, VMS marketplace, Triangle Engine, Nigerian tech, African innovation')
    setMeta('meta[name="author"]', 'Akinyemi Akinjide Samuel')
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', fullDesc)
    setMeta('meta[property="og:image"]', fullImage)
    setMeta('meta[property="og:url"]', fullUrl)
    setMeta('meta[property="og:type"]', type)
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', fullDesc)
    setMeta('meta[name="twitter:image"]', fullImage)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = fullUrl

    if (schema) {
      let el = document.getElementById('page-schema')
      if (!el) { el = document.createElement('script'); el.id = 'page-schema'; el.type = 'application/ld+json'; document.head.appendChild(el) }
      el.textContent = JSON.stringify(schema)
    }
  }, [fullTitle, fullDesc, fullUrl, fullImage, schema])

  return null
}
