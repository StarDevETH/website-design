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

function safePathname() {
  if (typeof window === "undefined") return "";
  return String(window.location?.pathname || "");
}

export function isAltTheme() {
  if (typeof document !== "undefined") {
    const theme = document.documentElement?.dataset?.theme;
    if (theme === "bourland") return true;
  }

  // Fallback for static hosting where data-theme might not exist.
  return safePathname().includes("alt-");
}

export function route(name) {
  const alt = isAltTheme();

  switch (name) {
    case "home":
      return alt ? "/alt-index.html" : "/";
    case "services":
      return alt ? "/alt-services.html" : "/services.html";
    case "gallery":
      return alt ? "/alt-gallery.html" : "/gallery.html";
    case "workWithUs":
      return alt ? "/alt-work-with-us.html" : "/work-with-us.html";
    case "contact":
      return alt ? "/alt-contact.html" : "/contact.html";
    default:
      return "/";
  }
}
