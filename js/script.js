// Shared behavior across all pages: mobile nav, footer year, gallery +
// lightbox (gallery pages), and the homepage hero slider.

// ---------- Mobile nav ----------
const navToggle = document.querySelector(".nav-toggle");
const sidebar = document.getElementById("sidebar");

navToggle.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  sidebar.classList.toggle("open");
});

sidebar.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.setAttribute("aria-expanded", "false");
    sidebar.classList.remove("open");
  });
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Gallery + lightbox (birds.html, nature-and-light.html) ----------
const galleryEl = document.getElementById("gallery");

if (galleryEl && typeof GALLERY_PHOTOS !== "undefined") {
  GALLERY_PHOTOS.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.dataset.index = index;

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = "lazy";

    item.appendChild(img);
    galleryEl.appendChild(item);
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let currentIndex = 0;

  function updateLightboxImage() {
    const photo = GALLERY_PHOTOS[currentIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add("active");
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
    updateLightboxImage();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % GALLERY_PHOTOS.length;
    updateLightboxImage();
  }

  galleryEl.addEventListener("click", (e) => {
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
}

// ---------- Homepage hero slider ----------
const sliderEl = document.getElementById("heroSlider");

if (sliderEl && typeof SLIDER_PHOTOS !== "undefined" && SLIDER_PHOTOS.length) {
  SLIDER_PHOTOS.forEach((photo, index) => {
    const slide = document.createElement("div");
    slide.className = "slide" + (index === 0 ? " active" : "");
    slide.style.backgroundImage = `url('${photo.src}')`;

    const caption = document.createElement("div");
    caption.className = "slide-caption";
    caption.textContent = photo.title || photo.alt;
    slide.appendChild(caption);

    sliderEl.appendChild(slide);
  });

  const slides = sliderEl.querySelectorAll(".slide");

  if (slides.length > 1) {
    const dots = document.createElement("div");
    dots.className = "slide-dots";
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "slide-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dot.addEventListener("click", () => goToSlide(index));
      dots.appendChild(dot);
    });
    sliderEl.appendChild(dots);

    const dotEls = dots.querySelectorAll(".slide-dot");
    let current = 0;
    let timer;

    function goToSlide(index) {
      slides[current].classList.remove("active");
      dotEls[current].classList.remove("active");
      current = index;
      slides[current].classList.add("active");
      dotEls[current].classList.add("active");
    }

    function nextSlide() {
      goToSlide((current + 1) % slides.length);
    }

    function startAutoplay() {
      timer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      clearInterval(timer);
    }

    startAutoplay();
    sliderEl.addEventListener("mouseenter", stopAutoplay);
    sliderEl.addEventListener("mouseleave", startAutoplay);
  }
}
