export const SITE = {
  businessName: "D&M Landscaping Kings LLC",
  tagline: "Outdoor Dreams, Delivered.",
  sinceYear: 2006,
  serviceArea: "Temple, Belton, Salado, and Killeen (Central Texas)",
  phoneDisplay: "254-541-1867",
  phoneE164: "+12545411867",
  email: "dmlandscapingkings@gmail.com"
};

export const FORMSPREE = {
  // Paste each Formspree form endpoint here, for example: https://formspree.io/f/xxxxabcd
  quoteEndpoint: "https://formspree.io/f/mgonookb",
  jobEndpoint: "https://formspree.io/f/xyknkkjb"
};

export function route(name) {
  switch (name) {
    case "home":
      return "/";
    case "services":
      return "/services";
    case "gallery":
      return "/gallery";
    case "workWithUs":
      return "/work-with-us";
    case "contact":
      return "/contact";
    default:
      return "/";
  }
}
