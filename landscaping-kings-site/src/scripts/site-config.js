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
  contactFormEmbedUrl: "",
  workWithUsFormEmbedUrl: ""
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
