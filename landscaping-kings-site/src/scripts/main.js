import { SITE, route } from "./site-config.js";

const COLOR_MODE_KEY = "dmk-color-mode";
const DEFAULT_COLOR_MODE = "dark";
const LOGO_ASSET_VERSION = "20260227-3";
const LOGO_LIGHT_SRC = `/assets/logo-bush-light.png?v=${LOGO_ASSET_VERSION}`;
const LOGO_DARK_SRC = `/assets/logo-bush-dark.png?v=${LOGO_ASSET_VERSION}`;
const REVIEW_STYLES = new Set(["glass", "cards", "compact"]);
const GOOGLE_REVIEWS_URL =
  "https://share.google/FlHwn4OswIDit1eaL";
const HERO_REVIEW_SUMMARY = {
  rating: "4.8",
  count: 29
};
const HERO_REVIEWS = [
  {
    quote:
      "Clean bed lines, fresh mulch, and great communication from quote to final cleanup.",
    author: "Temple homeowner",
    service: "Bed Refresh + Cleanup"
  },
  {
    quote:
      "Pavers and turf came out sharp, and the team respected our schedule and property.",
    author: "Belton homeowner",
    service: "Pavers + Turf Install"
  },
  {
    quote:
      "They solved drainage and planting in one visit. Fast turnaround and pro-level finish.",
    author: "Salado homeowner",
    service: "Drainage + Planting"
  },
  {
    quote:
      "Rock borders and shrubs look premium. Exactly the crisp look we wanted for resale.",
    author: "Killeen homeowner",
    service: "Rock Borders + Shrubs"
  }
];

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

function setTextAll(sel, value) {
  qsa(sel).forEach((el) => setText(el, value));
}

function setHref(el, value) {
  if (!el) return;
  el.setAttribute("href", value);
}

function normalizeMode(mode) {
  if (mode === "dark" || mode === "light") return mode;
  return null;
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_) {
    // Ignore storage errors.
  }
}

function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (_) {
    // Ignore storage errors.
  }
}

function getSystemMode() {
  if (!window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getDefaultMode() {
  const fromMarkup = normalizeMode(document.documentElement?.dataset?.mode);
  return fromMarkup || DEFAULT_COLOR_MODE;
}

function applyColorMode(mode) {
  const safe = normalizeMode(mode) || "light";
  document.documentElement.dataset.mode = safe;

  const logoSrc = safe === "dark" ? LOGO_DARK_SRC : LOGO_LIGHT_SRC;
  qsa("[data-logo-mark]").forEach((img) => {
    if (img.getAttribute("src") !== logoSrc) img.setAttribute("src", logoSrc);
  });

  const themeMeta = qs("meta[name='theme-color']", document.head);
  if (!themeMeta) return;

  const cssTheme = getComputedStyle(document.documentElement)
    .getPropertyValue("--theme-meta-color")
    .trim();
  themeMeta.setAttribute("content", cssTheme || (safe === "dark" ? "#101614" : "#57c343"));
}

function initColorMode() {
  const params = new URLSearchParams(window.location.search);
  const queryMode = params.get("theme");
  const normalizedQuery = normalizeMode(queryMode);
  const prefersAuto = queryMode === "auto";

  if (prefersAuto) {
    storageRemove(COLOR_MODE_KEY);
  } else if (normalizedQuery) {
    storageSet(COLOR_MODE_KEY, normalizedQuery);
  }

  const storedMode = normalizeMode(storageGet(COLOR_MODE_KEY));
  const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const fallbackMode = prefersAuto ? getSystemMode() : getDefaultMode();
  applyColorMode(storedMode || fallbackMode);

  if (!prefersAuto || storedMode || !mql) return;

  const onChange = (e) => applyColorMode(e.matches ? "dark" : "light");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onChange);
  } else if (typeof mql.addListener === "function") {
    mql.addListener(onChange);
  }
}

function prettyTelHref(e164) {
  if (!e164) return "";
  return `tel:${e164}`;
}

function initHeader() {
  const header = qs("[data-header]");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("isScrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initNav() {
  const toggle = qs("[data-nav-toggle]");
  const nav = qs("[data-nav]");

  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("isOpen", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });
}

function initCurrentNav() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  qsa(".siteNav a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    const normalized = href === "/" ? "/" : href.replace(/\/+$/, "");
    if (normalized === path) a.setAttribute("aria-current", "page");
  });
}

function initStickyOffsets() {
  const topBar = qs(".topBar");
  const header = qs(".siteHeader");
  if (!header) return;

  const apply = () => {
    const topBarHeight = topBar ? Math.ceil(topBar.getBoundingClientRect().height) : 0;
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    const headerStackHeight = topBarHeight + headerHeight;

    document.documentElement.style.setProperty("--topbar-h", `${topBarHeight}px`);
    document.documentElement.style.setProperty("--siteheader-h", `${headerHeight}px`);
    document.documentElement.style.setProperty("--header-stack-h", `${headerStackHeight}px`);
  };

  apply();
  window.addEventListener("resize", apply, { passive: true });
  window.addEventListener("orientationchange", apply, { passive: true });
  window.addEventListener("load", apply, { once: true });

  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    document.fonts.ready.then(apply).catch(() => {});
  }
}

function initReveals() {
  const els = qsa(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (!ent.isIntersecting) continue;
        ent.target.classList.add("isIn");
        io.unobserve(ent.target);
      }
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}

function normalizeReviewStyle(value) {
  if (!value) return null;
  const safe = String(value).toLowerCase().trim();
  return REVIEW_STYLES.has(safe) ? safe : null;
}

function initHeroReviews() {
  const root = qs("[data-review-carousel]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const queryStyle = normalizeReviewStyle(params.get("reviewStyle") || params.get("reviews"));
  const mobileDefault =
    window.matchMedia && window.matchMedia("(max-width: 900px)").matches
      ? "compact"
      : "glass";
  const style = queryStyle || normalizeReviewStyle(root.dataset.reviewStyle) || mobileDefault;
  const reviewLink = root.dataset.reviewLink || GOOGLE_REVIEWS_URL;

  root.dataset.reviewStyle = style;
  root.innerHTML = `
    <div class="heroReviewsMeta">
      <span class="heroReviewsSource">Google Reviews</span>
      <a class="heroReviewsLink" href="${reviewLink}" target="_blank" rel="noopener noreferrer">See all</a>
    </div>
    <div class="heroReviewsRating" aria-label="Google rating ${HERO_REVIEW_SUMMARY.rating} out of 5 from ${HERO_REVIEW_SUMMARY.count} reviews">
      <span class="heroReviewsScore">${HERO_REVIEW_SUMMARY.rating}</span>
      <span class="heroReviewsStars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
      <span class="heroReviewsCount">(${HERO_REVIEW_SUMMARY.count})</span>
    </div>
    <div class="heroReviewsViewport" data-review-slides></div>
    <div class="heroReviewsControls">
      <button class="heroReviewsBtn" type="button" data-review-prev aria-label="Previous review">&larr;</button>
      <div class="heroReviewsDots" data-review-dots></div>
      <button class="heroReviewsBtn" type="button" data-review-next aria-label="Next review">&rarr;</button>
    </div>
  `;

  const slidesHost = qs("[data-review-slides]", root);
  const dotsHost = qs("[data-review-dots]", root);
  if (!slidesHost || !dotsHost) return;

  HERO_REVIEWS.forEach((item, index) => {
    const slide = document.createElement("article");
    slide.className = "heroReviewSlide";
    slide.setAttribute("aria-hidden", "true");
    slide.innerHTML = `
      <p class="heroReviewQuote">"${item.quote}"</p>
      <p class="heroReviewMetaLine">
        <span class="heroReviewAuthor">${item.author}</span>
        <span class="heroReviewService">${item.service}</span>
      </p>
    `;
    slidesHost.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "heroReviewsDot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show review ${index + 1}`);
    dot.addEventListener("click", () => setActive(index));
    dotsHost.appendChild(dot);
  });

  const slides = qsa(".heroReviewSlide", root);
  const dots = qsa(".heroReviewsDot", root);
  if (!slides.length || !dots.length) return;

  let activeIndex = 0;

  function setActive(index) {
    const safeIndex = (index + slides.length) % slides.length;
    activeIndex = safeIndex;

    slides.forEach((slide, i) => {
      const isActive = i === safeIndex;
      slide.classList.toggle("isActive", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    dots.forEach((dot, i) => {
      const isActive = i === safeIndex;
      dot.classList.toggle("isActive", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  setActive(0);

  const prev = qs("[data-review-prev]", root);
  const next = qs("[data-review-next]", root);
  if (!prev || !next) return;

  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAutoplay = HERO_REVIEWS.length > 1 && !reducedMotion;
  let timer = null;

  const stopAuto = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    if (!canAutoplay || timer) return;
    timer = window.setInterval(() => setActive(activeIndex + 1), 5200);
  };

  prev.addEventListener("click", () => {
    stopAuto();
    setActive(activeIndex - 1);
    startAuto();
  });

  next.addEventListener("click", () => {
    stopAuto();
    setActive(activeIndex + 1);
    startAuto();
  });

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);
  root.addEventListener("focusin", stopAuto);
  root.addEventListener("focusout", startAuto);
  startAuto();
}

function hydrateSiteBits() {
  setTextAll("[data-business-name]", SITE.businessName);
  setTextAll("[data-tagline]", SITE.tagline);
  setTextAll("[data-service-area]", SITE.serviceArea);
  setTextAll("[data-phone-display]", SITE.phoneDisplay);
  setTextAll("[data-email]", SITE.email);

  qsa("[data-phone-href]").forEach((el) => setHref(el, prettyTelHref(SITE.phoneE164)));
  qsa("[data-email-href]").forEach((el) => setHref(el, `mailto:${SITE.email}`));

  qsa("[data-year]").forEach((el) => setText(el, String(new Date().getFullYear())));
}

async function loadJson(path) {
  const res = await fetch(path, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function renderServiceCard(service, categoryLabel) {
  const li = document.createElement("article");
  li.className = "serviceCard reveal";

  li.innerHTML = `
    <div class="serviceHead">
      <div class="pill" title="${categoryLabel}">
        <span class="dot" aria-hidden="true"></span>
        <span>${categoryLabel}</span>
      </div>
    </div>
    <h3 class="serviceTitle">${service.title}</h3>
    <p class="serviceSummary">${service.summary}</p>
    <ul class="serviceIncluded">
      ${(service.included || []).slice(0, 3).map((x) => `<li>${x}</li>`).join("")}
    </ul>
  `;

  return li;
}

async function renderServices() {
  const grid = qs("[data-services-grid]");
  if (!grid) return;

  const [categories, servicesJson] = await Promise.all([
    loadJson("/data/categories.json"),
    loadJson("/data/services.json")
  ]);

  grid.replaceChildren();

  for (const svc of servicesJson.services || []) {
    const label = categories[svc.tag] || `Category ${svc.tag}`;
    grid.appendChild(renderServiceCard(svc, label));
  }
}

function renderGalleryPreviewCard(item, categoryLabel) {
  const a = document.createElement("a");
  a.className = "galleryCard";
  a.href = `${route("gallery")}?tag=${encodeURIComponent(item.tag)}`;
  a.innerHTML = `
    <img src="${item.thumb || item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />
    <div class="mediaLabel pill">
      <span class="dot" aria-hidden="true"></span>
      <span>${categoryLabel}</span>
    </div>
  `;
  return a;
}

async function renderGalleryPreview() {
  const wrap = qs("[data-gallery-preview]");
  if (!wrap) return;

  const [categories, galleryJson] = await Promise.all([
    loadJson("/data/categories.json"),
    loadJson("/data/gallery.json")
  ]);

  const items = (galleryJson.items || []).slice(0, 10);
  wrap.replaceChildren();

  for (const item of items) {
    const label = categories[item.tag] || `Category ${item.tag}`;
    wrap.appendChild(renderGalleryPreviewCard(item, label));
  }
}

function renderGoogleForm(container, embedUrl) {
  if (!container) return;

  if (!embedUrl) {
    container.innerHTML = `
      <div class="formPlaceholder">
        <p><strong>Form not connected yet.</strong></p>
        <p>Paste your Google Forms embed URL into <code>landscaping-kings-site/src/scripts/site-config.js</code> and reload.</p>
        <p>Use the Google Forms “Send” → “&lt;&gt;” embed link.</p>
      </div>
    `;
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.title = "Form";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.src = embedUrl;
  container.replaceChildren(iframe);
}

function renderForms() {
  renderGoogleForm(qs("[data-google-form='contact']"), SITE.contactFormEmbedUrl);
  renderGoogleForm(qs("[data-google-form='work']"), SITE.workWithUsFormEmbedUrl);
}

async function run() {
  initColorMode();
  initStickyOffsets();
  initHeader();
  initNav();
  initCurrentNav();
  initHeroReviews();
  initReveals();
  hydrateSiteBits();
  renderForms();

  try {
    await Promise.all([renderServices(), renderGalleryPreview()]);
    initReveals();
  } catch (err) {
    // Fail soft; the site should still render if JSON isn't reachable.
    console.warn(err);
  }
}

run();

