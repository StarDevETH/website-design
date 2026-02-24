import { SITE, route } from "./site-config.js";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

async function loadJson(path) {
  const res = await fetch(path, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function getQueryTag() {
  const url = new URL(window.location.href);
  const tag = url.searchParams.get("tag");
  return tag && tag.trim() ? tag.trim().toUpperCase() : "";
}

function setQueryTag(tag) {
  const url = new URL(window.location.href);
  if (tag) url.searchParams.set("tag", tag);
  else url.searchParams.delete("tag");
  history.replaceState({}, "", url);
}

function createChip(label, value, active) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `chip${active ? " isActive" : ""}`;
  btn.dataset.tag = value;
  btn.textContent = label;
  return btn;
}

function createTile(item, categoryLabel, idx) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile";
  btn.dataset.index = String(idx);

  btn.innerHTML = `
    <img src="${item.thumb || item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />
    <div class="tileMeta pill">
      <span class="dot" aria-hidden="true"></span>
      <span>${item.tag} — ${categoryLabel}</span>
    </div>
  `;

  return btn;
}

function ensureLightbox() {
  let root = qs("[data-lightbox]");
  if (root) return root;

  root = document.createElement("div");
  root.className = "lightbox";
  root.dataset.lightbox = "true";

  const contactHref = route("contact");

  root.innerHTML = `
    <div class="lightboxBackdrop" data-close="true"></div>
    <div class="lightboxShell" role="dialog" aria-modal="true" aria-label="Gallery viewer">
      <div class="lightboxTop">
        <div class="lightboxTitle" data-lb-title></div>
        <div style="display:flex;gap:10px;align-items:center">
          <button class="iconBtn" type="button" data-prev="true" aria-label="Previous image">Prev</button>
          <button class="iconBtn" type="button" data-next="true" aria-label="Next image">Next</button>
          <button class="iconBtn" type="button" data-close="true" aria-label="Close viewer">Close</button>
        </div>
      </div>
      <div class="lightboxTrack" data-lb-track></div>
      <div class="lightboxBottom">
        <div>
          <div class="lightboxTitle" data-lb-caption></div>
          <div class="lightboxSub" data-lb-sub></div>
        </div>
        <a class="iconBtn" href="${contactHref}" title="Get a quote">Get a quote</a>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  return root;
}

function lockScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, x));
}

function computeActiveIndex(track) {
  const w = track.clientWidth || 1;
  return Math.round(track.scrollLeft / w);
}

function scrollToIndex(track, idx, count) {
  const safeCount = Math.max(0, Number(count) || 0);
  const target = clampInt(idx, 0, Math.max(0, safeCount - 1));
  const w = track.clientWidth || 1;
  track.scrollTo({ left: target * w, behavior: "smooth" });
}

function openLightbox(lb, slides, startIndex, meta) {
  const track = qs("[data-lb-track]", lb);
  const title = qs("[data-lb-title]", lb);
  const caption = qs("[data-lb-caption]", lb);
  const sub = qs("[data-lb-sub]", lb);

  track.replaceChildren();
  for (const slide of slides) track.appendChild(slide);

  lb.classList.add("isOpen");
  lockScroll(true);

  const updateMeta = () => {
    const idx = Math.max(0, Math.min(slides.length - 1, computeActiveIndex(track)));
    const item = meta.items[idx];
    title.textContent = `${meta.categoryLabel} • ${idx + 1}/${slides.length}`;
    caption.textContent = item.title || "";
    sub.textContent = item.alt || "";
  };

  const rafUpdate = () => requestAnimationFrame(updateMeta);

  const onKeyDown = (e) => {
    if (e.key === "Escape") closeLightbox(lb);
    if (e.key === "ArrowLeft")
      scrollToIndex(track, computeActiveIndex(track) - 1, slides.length);
    if (e.key === "ArrowRight")
      scrollToIndex(track, computeActiveIndex(track) + 1, slides.length);
  };

  const onClick = (e) => {
    const closeBtn = e.target.closest("[data-close='true']");
    if (closeBtn) closeLightbox(lb);
    const prevBtn = e.target.closest("[data-prev='true']");
    if (prevBtn) scrollToIndex(track, computeActiveIndex(track) - 1, slides.length);
    const nextBtn = e.target.closest("[data-next='true']");
    if (nextBtn) scrollToIndex(track, computeActiveIndex(track) + 1, slides.length);
  };

  const onResize = () => {
    const idx = computeActiveIndex(track);
    track.scrollLeft = idx * (track.clientWidth || 1);
  };

  track.addEventListener("scroll", rafUpdate, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize, { passive: true });
  lb.addEventListener("click", onClick);

  lb._cleanup = () => {
    track.removeEventListener("scroll", rafUpdate);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", onResize);
    lb.removeEventListener("click", onClick);
  };

  requestAnimationFrame(() => {
    track.scrollLeft = startIndex * (track.clientWidth || 1);
    updateMeta();
  });
}

function closeLightbox(lb) {
  lb.classList.remove("isOpen");
  lockScroll(false);
  if (typeof lb._cleanup === "function") lb._cleanup();
  lb._cleanup = null;
}

function buildSlides(items) {
  return items.map((item) => {
    const slide = document.createElement("div");
    slide.className = "lightboxSlide";
    slide.innerHTML = `<img src="${item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />`;
    return slide;
  });
}

async function runGallery() {
  const filters = qs("[data-gallery-filters]");
  const grid = qs("[data-gallery-grid]");
  if (!filters || !grid) return;

  const [categories, galleryJson] = await Promise.all([
    loadJson("/data/categories.json"),
    loadJson("/data/gallery.json")
  ]);

  const allItems = galleryJson.items || [];

  const tags = Array.from(new Set(allItems.map((x) => x.tag).filter(Boolean)))
    .map((t) => String(t).toUpperCase())
    .sort();

  let activeTag = getQueryTag();
  if (activeTag && !tags.includes(activeTag)) activeTag = "";

  const lb = ensureLightbox();
  let visibleItems = [];
  let slides = [];

  const render = () => {
    filters.replaceChildren();
    filters.appendChild(createChip("All", "", !activeTag));
    for (const tag of tags) {
      const label = `${tag} — ${categories[tag] || `Category ${tag}`}`;
      filters.appendChild(createChip(label, tag, tag === activeTag));
    }

    visibleItems = activeTag ? allItems.filter((x) => x.tag === activeTag) : allItems;
    grid.replaceChildren();

    if (!visibleItems.length) {
      const empty = document.createElement("div");
      empty.className = "formPlaceholder";
      empty.innerHTML = `
        <p><strong>No photos yet for this category.</strong></p>
        <p>Add items to <code>landscaping-kings-site/public/data/gallery.json</code> and reload.</p>
      `;
      grid.appendChild(empty);
      return;
    }

    slides = buildSlides(visibleItems);

    visibleItems.forEach((item, idx) => {
      const label = categories[item.tag] || `Category ${item.tag}`;
      grid.appendChild(createTile(item, label, idx));
    });
  };

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".tile");
    if (!btn) return;
    const idx = Number(btn.dataset.index || "0");
    const categoryLabel = activeTag
      ? categories[activeTag] || `Category ${activeTag}`
      : "All work";
    openLightbox(lb, slides, idx, { items: visibleItems, categoryLabel });
  });

  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    const tag = btn.dataset.tag || "";
    activeTag = tag;
    setQueryTag(activeTag);
    render();
  });

  render();
}

function hydrateBits() {
  const phone = qs("[data-phone-display]");
  const phoneHref = qs("[data-phone-href]");
  const email = qs("[data-email]");
  const emailHref = qs("[data-email-href]");

  if (phone) phone.textContent = SITE.phoneDisplay;
  if (phoneHref) phoneHref.setAttribute("href", `tel:${SITE.phoneE164}`);
  if (email) email.textContent = SITE.email;
  if (emailHref) emailHref.setAttribute("href", `mailto:${SITE.email}`);
}

hydrateBits();
runGallery().catch((err) => console.warn(err));
