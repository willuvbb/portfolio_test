#!/usr/bin/env node
// Renders the photo data in js/photos.js into real, static <img> markup
// inside each gallery page's <!-- GALLERY:START/END --> block and the
// homepage's <!-- SLIDER:START/END --> block. This exists so that search
// engines (and anyone with JS disabled) see actual photographs — with alt
// text — in the page source, instead of an empty div/section that only
// fills in after script.js runs.
//
// script.js still re-lays-out the gallery into a true masonry grid on
// load, and still wires up the hero slider's autoplay/dots/swipe — this
// script only needs to produce a reasonable static seed for first paint
// and for crawlers.
//
// Run after editing js/photos.js and before deploying:
//   node tools/generate-static.js

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

const GALLERY_PAGES = [
  { file: "wildlife.html", varName: "WILDLIFE_PHOTOS" },
  { file: "nature-and-light.html", varName: "NATURE_PHOTOS" },
  { file: "portraits.html", varName: "PORTRAITS_PHOTOS" },
  { file: "woodshop.html", varName: "WOODSHOP_PHOTOS" },
  { file: "sports.html", varName: "SPORTS_PHOTOS" },
  { file: "mckinley-tech.html", varName: "MCKINLEY_TECH_PHOTOS" },
];

const GALLERY_COLUMNS = 3;

function loadPhotoData() {
  const src = fs.readFileSync(path.join(ROOT, "js", "photos.js"), "utf8");
  const data = {};
  const arrayPattern = /const\s+(\w+)\s*=\s*(\[[\s\S]*?\n\];)/g;
  let match;
  while ((match = arrayPattern.exec(src))) {
    const [, name, arrayLiteral] = match;
    // The array literal is plain data (string props only) written by us —
    // safe to evaluate directly rather than hand-writing a JSON parser.
    data[name] = new Function(`return ${arrayLiteral.slice(0, -1)};`)();
  }
  return data;
}

function getImageSize(relSrc) {
  const absPath = path.join(ROOT, relSrc);
  try {
    const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", absPath], {
      encoding: "utf8",
    });
    const width = Number((/pixelWidth:\s*(\d+)/.exec(out) || [])[1]);
    const height = Number((/pixelHeight:\s*(\d+)/.exec(out) || [])[1]);
    if (width && height) return { width, height };
  } catch (err) {
    console.warn(`  ! could not read dimensions for ${relSrc}: ${err.message}`);
  }
  return null;
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderGallery(photos) {
  const columns = Array.from({ length: GALLERY_COLUMNS }, () => []);
  photos.forEach((photo, index) => {
    const size = getImageSize(photo.src);
    const sizeAttrs = size ? ` width="${size.width}" height="${size.height}"` : "";
    const markup =
      `      <button class="gallery-item" type="button" data-index="${index}" ` +
      `aria-label="View larger photo: ${escapeAttr(photo.alt)}">\n` +
      `        <img src="${photo.src}" alt="${escapeAttr(photo.alt)}" loading="lazy"${sizeAttrs}>\n` +
      `      </button>`;
    columns[index % GALLERY_COLUMNS].push(markup);
  });

  const columnsMarkup = columns
    .map((items) => `    <div class="gallery-column">\n${items.join("\n")}\n    </div>`)
    .join("\n");

  return `<div class="gallery" id="gallery">\n${columnsMarkup}\n  </div>`;
}

function renderSlider(photos) {
  const slides = photos.map((photo, index) => {
    const size = getImageSize(photo.src);
    let orientationClass = "";
    if (size) {
      if (size.width > size.height) orientationClass = " landscape-photo";
      else if (size.height > size.width) orientationClass = " portrait-photo";
    }
    const activeClass = index === 0 ? " active" : "";
    const loading = index === 0 ? "eager" : "lazy";
    return (
      `    <div class="slide${activeClass}${orientationClass}" data-index="${index}">\n` +
      `      <img src="${photo.src}" alt="${escapeAttr(photo.alt)}" loading="${loading}">\n` +
      `    </div>`
    );
  });
  return slides.join("\n");
}

function replaceBetweenMarkers(html, startMarker, endMarker, replacement, fileLabel) {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`markers ${startMarker} / ${endMarker} not found in ${fileLabel}`);
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  return `${before}\n    ${replacement}\n    ${after}`;
}

function main() {
  const photoData = loadPhotoData();

  GALLERY_PAGES.forEach(({ file, varName }) => {
    const photos = photoData[varName];
    if (!photos) {
      console.warn(`! ${varName} not found in photos.js, skipping ${file}`);
      return;
    }
    const filePath = path.join(ROOT, file);
    let html = fs.readFileSync(filePath, "utf8");
    const gallery = renderGallery(photos);
    html = replaceBetweenMarkers(html, "<!-- GALLERY:START -->", "<!-- GALLERY:END -->", gallery, file);
    fs.writeFileSync(filePath, html);
    console.log(`updated ${file} (${photos.length} photos)`);
  });

  const sliderPhotos = photoData.SLIDER_PHOTOS;
  if (sliderPhotos) {
    const indexPath = path.join(ROOT, "index.html");
    let html = fs.readFileSync(indexPath, "utf8");
    const slider = renderSlider(sliderPhotos);
    html = replaceBetweenMarkers(html, "<!-- SLIDER:START -->", "<!-- SLIDER:END -->", slider, "index.html");
    fs.writeFileSync(indexPath, html);
    console.log(`updated index.html (${sliderPhotos.length} slides)`);
  }
}

main();
