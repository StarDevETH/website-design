export const SITE = {
  businessName: "D&M Landscaping Kings LLC",
  tagline: "Outdoor Dreams, Delivered.",
  sinceYear: 2006,
  serviceArea: "Temple, Belton, Salado, and Killeen (Central Texas)",
  phoneDisplay: "254-541-1867",
  phoneE164: "+12545411867",
  email: "dmlandscapingkings@gmail.com",

  // Paste Google Forms "Embed" URLs here when ready.
  // Example embed URL format:
  //   https://docs.google.com/forms/d/e/<FORM_ID>/viewform?embedded=true
  contactFormEmbedUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdFWnJL9NzEFO5b-RAUx-daBXxd4dN0BFK_CSKf7DmWieanPA/viewform?embedded=true",
  workWithUsFormEmbedUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf-IURBKZU7KC17pAMvOFBqEkBL6xjXBByM7PPWVpyWOOaNxQ/viewform?embedded=true"
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
