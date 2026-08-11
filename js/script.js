// Renders the gallery from PHOTOS (js/photos.js) and wires up the lightbox and nav.

const gallery = document.getElementById("gallery");

PHOTOS.forEach((photo, index) => {
  const item = document.createElement("div");
  item.className = "gallery-item";
  item.dataset.index = index;

  const img = document.createElement("img");
  img.src = photo.src;
  img.alt = photo.alt;
  img.loading = "lazy";

  item.appendChild(img);
  gallery.appendChild(item);
});

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  updateLightboxImage();
  lightbox.classList.add("active");
}

function closeLightbox() {
  lightbox.classList.remove("active");
}

function updateLightboxImage() {
  const photo = PHOTOS[currentIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.alt;
}

function showPrev() {
  currentIndex = (currentIndex - 1 + PHOTOS.length) % PHOTOS.length;
  updateLightboxImage();
}

function showNext() {
  currentIndex = (currentIndex + 1) % PHOTOS.length;
  updateLightboxImage();
}

gallery.addEventListener("click", (e) => {
  const item = e.target.closest(".gallery-item");
  if (item) openLightbox(Number(item.dataset.index));
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", showPrev);
lightboxNext.addEventListener("click", showNext);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
});

// ---------- Mobile nav ----------
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  siteNav.classList.toggle("open");
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("open");
  });
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
