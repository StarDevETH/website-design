import { SITE, route } from "./site-config.js";
const TILE_BADGE_SRC = "/assets/logo-bush.png?v=20260227-3";
const DEBUG_LIGHTBOX = new URL(window.location.href).searchParams.get("debugLightbox") === "1";

function lbDebug(...args) {
  if (!DEBUG_LIGHTBOX) return;
  // eslint-disable-next-line no-console
  console.log("[lightbox]", ...args);
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function rewriteAdobeImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  const match = raw.match(
    /^https:\/\/photos\.adobe\.io\/v2\/spaces\/([a-f0-9]+)\/(.+)$/i
  );
  if (!match) return raw;

  const [, shareId, assetPath] = match;
  return `https://lightroom.adobe.com/v2c/spaces/${shareId}/${assetPath}`;
}

function normalizeGalleryItem(item) {
  return {
    ...item,
    src: rewriteAdobeImageUrl(item?.src),
    thumb: rewriteAdobeImageUrl(item?.thumb),
  };
}

async function loadJson(path) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
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

function stripJobMarker(text) {
  return String(text || "")
    .replace(/\s*\(job-[^)]+\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function createTile(item, categoryLabel, idx) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile";
  btn.dataset.index = String(idx);
  btn.dataset.itemId = String(item.id || "");

  btn.innerHTML = `
    <img src="${item.thumb || item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />
    <span class="tileBrandBadge" aria-hidden="true">
      <img src="${TILE_BADGE_SRC}" alt="" loading="lazy" decoding="async" />
    </span>
    <div class="tileMeta pill">
      <span class="dot" aria-hidden="true"></span>
      <span>${categoryLabel}</span>
    </div>
  `;

  return btn;
}

function pickShowcaseItems(items, categories, limit = 12) {
  if (!Array.isArray(items) || !items.length) return [];

  const order = Object.keys(categories || {});
  const orderedTags = order.length
    ? order
    : Array.from(new Set(items.map((item) => item.tag).filter(Boolean)));
  const buckets = new Map(orderedTags.map((tag) => [tag, []]));
  const fallback = [];

  for (const item of items) {
    const tag = String(item.tag || "").toUpperCase();
    if (buckets.has(tag)) buckets.get(tag).push(item);
    else fallback.push(item);
  }

  const picked = [];
  while (picked.length < limit) {
    let added = false;
    for (const tag of orderedTags) {
      const bucket = buckets.get(tag);
      if (!bucket || !bucket.length) continue;
      picked.push(bucket.shift());
      added = true;
      if (picked.length >= limit) break;
    }
    if (!added) break;
  }

  if (picked.length < limit) {
    for (const item of fallback) {
      picked.push(item);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

function createShowcaseTile(item, categoryLabel, idx) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "showcaseTile";
  btn.dataset.index = String(idx);
  btn.dataset.itemId = String(item.id || "");
  btn.setAttribute("aria-label", `Open ${categoryLabel} image`);

  btn.innerHTML = `
    <img src="${item.thumb || item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />
    <span class="showcaseBadge" aria-hidden="true">
      <img src="${TILE_BADGE_SRC}" alt="" loading="lazy" decoding="async" />
    </span>
    <span class="showcaseLabel">${categoryLabel}</span>
  `;

  return btn;
}

function ensureLightbox() {
  let root = qs("[data-lightbox]");
  if (root) {
    if (typeof root._cleanup === "function") root._cleanup();
    root.remove();
  }

  root = document.createElement("div");
  root.className = "lightbox";
  root.dataset.lightbox = "true";

  const contactHref = route("contact");

  root.innerHTML = `
    <div class="lightboxBackdrop" data-close="true"></div>
    <div class="lightboxShell" role="dialog" aria-modal="true" aria-label="Gallery viewer">
      <div class="lightboxStage">
        <div class="lightboxMain">
          <div class="lightboxTop">
            <div class="lightboxTitle" data-lb-title></div>
            <div class="lightboxControls">
              <button class="iconBtn" type="button" data-prev="true" aria-label="Previous image">Prev</button>
              <button class="iconBtn" type="button" data-next="true" aria-label="Next image">Next</button>
              <button class="iconBtn" type="button" data-close="true" aria-label="Close viewer">Close</button>
            </div>
          </div>
          <div class="lightboxTrack" data-lb-track>
            <img class="lightboxCurrentImage" data-lb-image alt="" loading="eager" decoding="async" />
          </div>
          <div class="lightboxBottom">
            <div>
              <div class="lightboxTitle" data-lb-caption></div>
              <div class="lightboxSub" data-lb-sub></div>
            </div>
            <a class="iconBtn lightboxQuoteBtn" href="${contactHref}" title="Get a quote">Get a quote</a>
          </div>
        </div>
        <aside class="lightboxSide" aria-label="Quick preview panel">
          <div class="lightboxSideTop">
            <div class="lightboxSideTitle">Up next</div>
            <div class="lightboxSideCount" data-lb-side-count></div>
          </div>
          <button
            class="lightboxSidePreview"
            type="button"
            data-next="true"
            aria-label="Preview next image"
          >
            <img data-lb-next-img src="" alt="" loading="lazy" decoding="async" />
          </button>
          <div class="lightboxThumbRail" data-lb-thumbs></div>
        </aside>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  lbDebug("ensureLightbox: created fresh shell");
  return root;
}

function lockScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(min, Math.min(max, x));
}

function openLightbox(lb, items, startIndex, categoryLabel) {
  const track = qs("[data-lb-track]", lb);
  const mainImg = qs("[data-lb-image]", lb);
  const shell = qs(".lightboxShell", lb);
  const stage = qs(".lightboxStage", lb);
  const side = qs(".lightboxSide", lb);
  const topBar = qs(".lightboxTop", lb);
  const bottomBar = qs(".lightboxBottom", lb);
  const title = qs("[data-lb-title]", lb);
  const caption = qs("[data-lb-caption]", lb);
  const sub = qs("[data-lb-sub]", lb);
  const sideCount = qs("[data-lb-side-count]", lb);
  const nextImg = qs("[data-lb-next-img]", lb);
  const thumbRail = qs("[data-lb-thumbs]", lb);
  const total = Math.max(0, items.length);
  if (!track || !mainImg || !total) return;
  lbDebug("openLightbox", { total, startIndex, categoryLabel });

  let activeIndex = clampInt(startIndex, 0, Math.max(0, total - 1));
  const getSafeItem = (idx) => items[clampInt(idx, 0, Math.max(0, items.length - 1))] || {};
  const wrapIndex = (idx) => ((idx % total) + total) % total;
  let renderToken = 0;

  const thumbs = [];
  if (thumbRail) {
    thumbRail.replaceChildren();

    items.forEach((item, idx) => {
      const thumbBtn = document.createElement("button");
      thumbBtn.type = "button";
      thumbBtn.className = "lightboxThumb";
      thumbBtn.dataset.index = String(idx);
      thumbBtn.setAttribute("aria-label", `Open image ${idx + 1}`);
      thumbBtn.innerHTML = `
        <img src="${item.thumb || item.src}" alt="${item.alt || ""}" loading="lazy" decoding="async" />
      `;
      thumbBtn.addEventListener("click", () => {
        goToIndex(idx);
      });
      thumbRail.appendChild(thumbBtn);
      thumbs.push(thumbBtn);
    });
  }

  lb.classList.add("isOpen");
  lockScroll(true);

  const setMainImage = (idx) => {
    const item = getSafeItem(idx);
    const primarySrc = String(item?.src || "").trim();
    const fallbackSrc = String(item?.thumb || primarySrc || "").trim();
    const token = ++renderToken;

    mainImg.alt = stripJobMarker(item?.alt || "");
    if (fallbackSrc) {
      mainImg.src = fallbackSrc;
    } else {
      mainImg.removeAttribute("src");
    }

    lbDebug("setMainImage: fallback", {
      idx,
      fallbackSrc,
      primarySrc,
      trackRect: track.getBoundingClientRect(),
      imageRect: mainImg.getBoundingClientRect(),
    });

    if (primarySrc && primarySrc !== fallbackSrc) {
      const hiRes = new Image();
      hiRes.decoding = "async";
      hiRes.onload = () => {
        if (!mainImg.isConnected || token !== renderToken) return;
        mainImg.src = primarySrc;
        lbDebug("setMainImage: hi-res loaded", {
          idx,
          src: mainImg.currentSrc || mainImg.src,
          natural: `${mainImg.naturalWidth}x${mainImg.naturalHeight}`,
          rendered: `${Math.round(mainImg.getBoundingClientRect().width)}x${Math.round(mainImg.getBoundingClientRect().height)}`,
        });
      };
      hiRes.onerror = () => {
        if (!mainImg.isConnected || token !== renderToken) return;
        if (fallbackSrc) mainImg.src = fallbackSrc;
        lbDebug("setMainImage: hi-res failed, fallback restored", { idx, fallbackSrc });
      };
      hiRes.src = primarySrc;
    }
  };

  mainImg.onerror = () => {
    const item = getSafeItem(activeIndex);
    const fallbackSrc = String(item?.thumb || item?.src || "").trim();
    if (fallbackSrc && mainImg.src !== fallbackSrc) mainImg.src = fallbackSrc;
    lbDebug("mainImg.onerror", { activeIndex, fallbackSrc });
  };

  mainImg.onload = () => {
    lbDebug("mainImg.onload", {
      activeIndex,
      src: mainImg.currentSrc || mainImg.src,
      natural: `${mainImg.naturalWidth}x${mainImg.naturalHeight}`,
      rendered: `${Math.round(mainImg.getBoundingClientRect().width)}x${Math.round(mainImg.getBoundingClientRect().height)}`,
      topDisplay: getComputedStyle(qs(".lightboxTop", lb)).display,
    });
  };

  const syncTrackInsets = () => {
    const topH = Math.ceil(topBar?.getBoundingClientRect().height || 0);
    const bottomH = Math.ceil(bottomBar?.getBoundingClientRect().height || 0);
    track.style.paddingTop = `${Math.max(18, topH + 10)}px`;
    track.style.paddingBottom = `${Math.max(18, bottomH + 10)}px`;
  };

  const enforceLayoutBounds = () => {
    if (stage) {
      stage.style.gridTemplateRows = "minmax(0, 1fr)";
      stage.style.alignItems = "stretch";
    }
    if (side) {
      side.style.minHeight = "0";
      side.style.overflow = "hidden";
    }

    const shellRect = shell?.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const shellH = shellRect?.height || viewportH || 0;
    const badHeight = trackRect.height > Math.max(shellH, viewportH) * 1.5;
    const badTop =
      shellRect && trackRect.top < shellRect.top - 120;
    const badBottom =
      shellRect && trackRect.bottom > shellRect.bottom + 120;

    if (badHeight || badTop || badBottom) {
      track.style.top = "0";
      track.style.right = "0";
      track.style.bottom = "0";
      track.style.left = "0";
      track.style.display = "grid";
      track.style.placeItems = "center";
      track.style.overflow = "hidden";
      lbDebug("enforceLayoutBounds: corrected track geometry", {
        shellRect,
        trackRect,
        viewportH,
      });
    }
  };

  const updateMeta = () => {
    const idx = activeIndex;
    const item = getSafeItem(idx);
    const nextIdx = (idx + 1) % total;
    const nextItem = getSafeItem(nextIdx);

    title.textContent = `${categoryLabel} - ${idx + 1}/${total}`;
    caption.textContent = stripJobMarker(item.title || "");
    sub.textContent = stripJobMarker(item.alt || "");
    if (sideCount) sideCount.textContent = `${idx + 1}/${total}`;

    if (nextImg && nextItem) {
      nextImg.src = nextItem.thumb || nextItem.src;
      nextImg.alt = nextItem.alt || "Next image preview";
    }

    thumbs.forEach((el, i) => {
      const isActive = i === idx;
      el.classList.toggle("isActive", isActive);
      el.setAttribute("aria-current", isActive ? "true" : "false");
    });

    const activeThumb = thumbs[idx];
    if (activeThumb) activeThumb.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const renderActive = () => {
    enforceLayoutBounds();
    syncTrackInsets();
    setMainImage(activeIndex);
    updateMeta();
    lbDebug("renderActive", {
      activeIndex,
      topText: title?.textContent || "",
      trackOverflow: getComputedStyle(track).overflow,
    });
  };

  function goToIndex(nextIdx) {
    activeIndex = wrapIndex(nextIdx);
    renderActive();
  }

  const onKeyDown = (e) => {
    if (e.key === "Escape") closeLightbox(lb);
    if (e.key === "ArrowLeft") goToIndex(activeIndex - 1);
    if (e.key === "ArrowRight") goToIndex(activeIndex + 1);
  };

  const onClick = (e) => {
    const closeBtn = e.target.closest("[data-close='true']");
    if (closeBtn) closeLightbox(lb);
    const prevBtn = e.target.closest("[data-prev='true']");
    if (prevBtn) goToIndex(activeIndex - 1);
    const nextBtn = e.target.closest("[data-next='true']");
    if (nextBtn) goToIndex(activeIndex + 1);
  };

  const onResize = () => renderActive();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize, { passive: true });
  lb.addEventListener("click", onClick);

  lb._cleanup = () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", onResize);
    lb.removeEventListener("click", onClick);
  };

  requestAnimationFrame(() => {
    renderActive();
    setTimeout(syncTrackInsets, 80);
  });
}

function closeLightbox(lb) {
  lb.classList.remove("isOpen");
  lockScroll(false);
  if (typeof lb._cleanup === "function") lb._cleanup();
  lb._cleanup = null;
}

async function runGallery() {
  const filters = qs("[data-gallery-filters]");
  const grid = qs("[data-gallery-grid]");
  const showcase = qs("[data-gallery-showcase]");
  if (!filters || !grid) return;

  const [categories, galleryJson] = await Promise.all([
    loadJson("/data/categories.json"),
    loadJson("/data/gallery.json"),
  ]);

  const allItems = (galleryJson.items || []).map(normalizeGalleryItem);

  const tags = Array.from(new Set(allItems.map((x) => x.tag).filter(Boolean)))
    .map((t) => String(t).toUpperCase())
    .sort();

  let activeTag = getQueryTag();
  if (activeTag && !tags.includes(activeTag)) activeTag = "";

  let visibleItems = [];

  if (showcase) {
    const featured = pickShowcaseItems(allItems, categories, 12);
    showcase.replaceChildren();

    featured.forEach((item) => {
      const label = categories[item.tag] || `Category ${item.tag}`;
      const globalIndex = allItems.findIndex((x) => x.id === item.id);
      if (globalIndex < 0) return;
      showcase.appendChild(createShowcaseTile(item, label, globalIndex));
    });

    showcase.addEventListener("click", (e) => {
      const btn = e.target.closest(".showcaseTile");
      if (!btn) return;
      const itemId = btn.dataset.itemId || "";
      const byId = allItems.findIndex((x) => String(x.id || "") === itemId);
      const fallback = Number(btn.dataset.index || "0");
      const idx = byId >= 0 ? byId : fallback;
      const lb = ensureLightbox();
      openLightbox(lb, allItems, idx, "All work");
    });
  }

  const render = () => {
    filters.replaceChildren();
    filters.appendChild(createChip("All", "", !activeTag));
    for (const tag of tags) {
      const label = categories[tag] || `Category ${tag}`;
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

    visibleItems.forEach((item, idx) => {
      const label = categories[item.tag] || `Category ${item.tag}`;
      grid.appendChild(createTile(item, label, idx));
    });
  };

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".tile");
    if (!btn) return;
    const itemId = btn.dataset.itemId || "";
    const byId = visibleItems.findIndex((x) => String(x.id || "") === itemId);
    const fallback = Number(btn.dataset.index || "0");
    const idx = byId >= 0 ? byId : fallback;
    const categoryLabel = activeTag ? categories[activeTag] || `Category ${activeTag}` : "All work";
    const lb = ensureLightbox();
    openLightbox(lb, visibleItems, idx, categoryLabel);
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
