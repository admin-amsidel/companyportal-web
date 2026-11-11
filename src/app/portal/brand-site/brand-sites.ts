/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
export interface BrandStatement {
  title: string;
  text: string;
}

export interface BrandPicture {
  src: string;
  alt: string;
  /** Shown over the picture. */
  label?: string;
}

/**
 * What a brand's page says. Everything is optional: a section with nothing in it does not show, so a brand can start
 * small and nothing is ever filled in with made-up text. The logo, name and business details come from the Brands page.
 */
export interface BrandSiteContent {
  tagline?: string;
  /** Used when no logo has been uploaded for the brand. */
  logo?: string;
  hero?: string;
  about?: { title: string; paragraphs: string[]; picture?: BrandPicture };
  vision?: BrandStatement;
  mission?: BrandStatement;
  values?: BrandStatement[];
  /** What the brand offers, with pictures. */
  offerings?: BrandPicture[];
  /** The kinds of customer the brand works for. */
  clientTypes?: { title: string; intro?: string; types: BrandStatement[]; picture?: BrandPicture };
  /** Named clients. */
  clients?: string[];
  projects?: { title: string; intro?: string; pictures: BrandPicture[] };
  /** Used for whatever the Brands page does not hold. */
  contact?: { phone?: string; email?: string; altEmail?: string; website?: string; hours?: string };
  /** The brand's page on the public site, inside this app. */
  publicLink?: string;
}

/**
 * Each brand's page, by brand code (the key must match the code on the Brands page). A brand with no entry here
 * still gets a page from its Brands-page details (logo, name, category, contact); add an entry to show more, with
 * its pictures in public/images/brands/<code>/. Example:
 *
 *   ACME: {
 *     tagline: 'Quality you can count on.',
 *     hero: 'images/brands/acme/hero.webp',
 *     about: { title: 'About us', paragraphs: ['...'] },
 *     contact: { phone: '+1 555 0100', email: 'hello@acme.example', website: 'acme.example' },
 *   },
 */
export const BRAND_SITES: Record<string, BrandSiteContent> = {
  AD: {
    tagline: 'A new name in doors and windows, built on old-fashioned care.',
    hero: 'images/brands/ad/hero.webp',
    about: {
      title: 'One team for every door and window in your building',
      paragraphs: [
        'Amsidel Doors & Windows started with a simple observation: most homeowners deal with three or four different suppliers for their windows, main door, internal doors and bathroom doors, and none of them talk to each other.',
        'We bring uPVC, aluminium, WPC and steel systems together with a complete range of safety, ABS, membrane, laminated, skin and fibre doors. One survey, one quotation, one installation team, and one number to call afterwards.',
      ],
      picture: { src: 'images/brands/ad/about.webp', alt: 'Bay window seat with large casement windows' },
    },
    vision: {
      title: 'Spaces people are proud to live and work in',
      text: 'To be the most trusted name for doors and windows in the homes and buildings we serve: designed with care, built to last and backed by honest service.',
    },
    mission: {
      title: 'Get every opening right, first time',
      text: 'Advise honestly, measure precisely, supply quality materials and install them properly, then stay available long after handover.',
    },
    values: [
      { title: 'Craftsmanship', text: 'Attention to detail in every frame, joint and finish.' },
      { title: 'Integrity', text: 'Clear pricing, honest timelines and promises we keep.' },
      { title: 'Customer first', text: 'Service that continues long after the installation.' },
      { title: 'Sustainability', text: 'Energy-efficient, long-life products that waste less.' },
    ],
    offerings: [
      { src: 'images/brands/ad/upvc.webp', alt: 'uPVC sliding doors and windows', label: 'uPVC' },
      { src: 'images/brands/ad/wpc.webp', alt: 'WPC doors', label: 'WPC' },
      { src: 'images/brands/ad/steel.webp', alt: 'Steel doors', label: 'Steel' },
      { src: 'images/brands/ad/safety.webp', alt: 'Safety doors', label: 'Safety' },
      { src: 'images/brands/ad/abs.webp', alt: 'ABS doors', label: 'ABS' },
      { src: 'images/brands/ad/membrane.webp', alt: 'Membrane doors', label: 'Membrane' },
      { src: 'images/brands/ad/laminated.webp', alt: 'Laminated doors', label: 'Laminated' },
      { src: 'images/brands/ad/skin.webp', alt: 'Skin doors', label: 'Skin' },
      { src: 'images/brands/ad/fibre.webp', alt: 'Fibre doors', label: 'Fibre' },
    ],
    clientTypes: {
      title: 'Homeowners, architects and builders',
      intro: "Whether it's a single bedroom door or every opening in an apartment project, we tailor the products, the schedule and the paperwork to the job.",
      types: [
        { title: 'Homeowners', text: 'Guidance on materials, styles and budgets for new homes and renovations.' },
        { title: 'Architects & interior designers', text: 'Samples, finishes and technical details to match your specification.' },
        { title: 'Builders & developers', text: 'Bulk supply and phased installation that fits your site schedule.' },
        { title: 'Dealers', text: "We're building a dealer network; get in touch to partner with us." },
      ],
      picture: { src: 'images/brands/ad/clients.webp', alt: 'Black-framed glazed doors on a house front' },
    },
    projects: {
      title: 'Projects & inspiration',
      intro: 'Ideas for entrances, living spaces and bedrooms. Choose a picture to see it larger.',
      pictures: [
        { src: 'images/brands/ad/project-01.webp', alt: 'Sage-green flush door with a slim handle' },
        { src: 'images/brands/ad/project-07.webp', alt: 'Oak door with frosted glass panels' },
        { src: 'images/brands/ad/project-08.webp', alt: 'Double oak entrance door with glass strips' },
        { src: 'images/brands/ad/project-09.webp', alt: 'Light wood bedroom door' },
        { src: 'images/brands/ad/project-cta.webp', alt: 'Red steel door in a living room' },
      ],
    },
    contact: { website: 'www.amsidel.com', hours: 'Mon – Sat · 9:30 AM – 6:30 PM' },
  },
  GF: {
    tagline: 'Slim frames, wide views: aluminium and glazed systems for modern spaces.',
    hero: 'images/brands/gf/hero.webp',
    about: {
      title: 'Frames that let the light in',
      paragraphs: [
        'Golden Frames designs, supplies and installs window and door frames for homes, offices and shops: aluminium sliding and casement systems, glazed and French doors, and box windows that turn a plain wall into a feature.',
        'Every frame is measured on site, made to size and fitted by our own team, with the hardware, glass and sealing chosen for the climate and the room it serves.',
      ],
      picture: { src: 'images/brands/gf/about.webp', alt: 'Floor-to-ceiling aluminium sliding windows' },
    },
    vision: {
      title: 'Brighter, more open buildings',
      text: 'To make large, light-filled openings simple and affordable for every home and workplace we work on.',
    },
    mission: {
      title: 'Precise frames, fitted properly',
      text: 'Measure exactly, build to size, install cleanly and stand behind every frame with prompt after-sales service.',
    },
    values: [
      { title: 'Precision', text: 'Frames made to the millimetre for a clean, draught-free fit.' },
      { title: 'Durability', text: 'Corrosion-resistant profiles and hardware that last.' },
      { title: 'Design', text: 'Slim sight-lines and finishes that suit modern interiors.' },
      { title: 'Service', text: 'One team from measurement to installation and beyond.' },
    ],
    offerings: [
      { src: 'images/brands/gf/aluminium-windows.webp', alt: 'Aluminium windows facing the sea', label: 'Aluminium windows' },
      { src: 'images/brands/gf/sliding-systems.webp', alt: 'Black-framed sliding doors to a patio', label: 'Sliding systems' },
      { src: 'images/brands/gf/casement-windows.webp', alt: 'Black casement windows with white trim', label: 'Casement windows' },
      { src: 'images/brands/gf/glazed-doors.webp', alt: 'Black glazed door in a bright room', label: 'Glazed doors' },
      { src: 'images/brands/gf/french-doors.webp', alt: 'French door with grid glazing', label: 'French doors' },
      { src: 'images/brands/gf/box-windows.webp', alt: 'Box window projecting from a facade', label: 'Box windows' },
    ],
    clientTypes: {
      title: 'Homes, offices and shopfronts',
      intro: 'From one bedroom window to a full building facade, we plan the frames, glass and schedule around the job.',
      types: [
        { title: 'Homeowners', text: 'Bigger, brighter windows and patio doors for new homes and renovations.' },
        { title: 'Architects', text: 'Profiles, finishes and glazing options to match the design intent.' },
        { title: 'Builders', text: 'Bulk frames delivered and fitted in phases to suit the site.' },
        { title: 'Commercial spaces', text: 'Shopfronts, office partitions and glazed entrances.' },
      ],
      picture: { src: 'images/brands/gf/clients.webp', alt: 'Modern house with full-width sliding windows' },
    },
    projects: {
      title: 'Projects & inspiration',
      intro: 'Openings we love. Choose a picture to see it larger.',
      pictures: [
        { src: 'images/brands/gf/project-10.webp', alt: 'Sliding glass door opening to a garden' },
        { src: 'images/brands/gf/project-14.webp', alt: 'Glazed double entrance doors' },
        { src: 'images/brands/gf/project-15.webp', alt: 'White-framed glass door on a grey facade' },
      ],
    },
  },
};
