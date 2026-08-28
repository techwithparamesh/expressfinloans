/** Public website contact details — update here to reflect across the site. */
export const SITE_CONTACT = {
  phone: "9009505005",
  phoneDisplay: "+91 90095 05005",
  phoneTel: "+919009505005",
  whatsappUrl: "https://wa.me/919009505005",
  email: "info@expressfinancialservices.loans",
  emailMailto: "mailto:info@expressfinancialservices.loans",
  addressLines: [
    "174, 3RD FLOOR, BJR COMPLEX",
    "NEW BALAJI COLONY, AIR BYPASS ROAD",
    "TIRUPATI, CHITOOR, ANDHRA PRADESH",
    "Pin 517502",
  ] as const,
  addressShort: "Tirupati, Andhra Pradesh — 517502",
  officeHours: "Mon - Sat: 9:00 AM - 6:00 PM",
  officeHoursFooter: "Mon - Sat: 9:00 AM - 7:00 PM",
} as const;

export const SITE_ADDRESS_SINGLE_LINE = SITE_CONTACT.addressLines.join(", ");

export const SITE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(SITE_ADDRESS_SINGLE_LINE)}&output=embed`;

export const SITE_MAPS_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_ADDRESS_SINGLE_LINE)}`;
