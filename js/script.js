// Shared behavior across all pages: mobile nav, footer year, gallery +
// lightbox (gallery pages), and the homepage hero slider.

// ---------- Mobile nav ----------
const navToggle = document.querySelector(".nav-toggle");
const sidebar = document.getElementById("sidebar");

function setSidebarOpen(isOpen) {
  navToggle.setAttribute("aria-expanded", String(isOpen));
  sidebar.classList.toggle("open", isOpen);
}

navToggle.addEventListener("click", () => {
  setSidebarOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

sidebar.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setSidebarOpen(false));
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Discourage right-click / drag-saving photos ----------
// Deters casual saving only — view-source, devtools, and screenshots
// still work, but this stops the common right-click / drag-to-desktop case.
document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG" || e.target.closest(".slide")) {
    e.preventDefault();
  }
});

document.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "IMG") {
    e.preventDefault();
  }
});

// ---------- Gallery + lightbox (wildlife.html, nature-and-light.html) ----------
const galleryEl = document.getElementById("gallery");

if (galleryEl && typeof GALLERY_PHOTOS !== "undefined") {
  // True masonry: each photo goes into whichever column is currently
  // shortest, based on its real aspect ratio. CSS column-count only
  // estimates one target height and dumps overflow into the last
  // column, which looks badly lopsided with a small/uneven photo set.
  function getColumnCount() {
    return window.innerWidth <= 900 ? 2 : 3;
  }

  function loadRatio(photo) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 4 / 3);
      img.onerror = () => resolve(4 / 3);
      img.src = photo.src;
    });
  }

  function layoutGallery(ratios) {
    const columnCount = getColumnCount();
    galleryEl.innerHTML = "";

    const columns = [];
    const heights = [];
    for (let i = 0; i < columnCount; i++) {
      const col = document.createElement("div");
      col.className = "gallery-column";
      galleryEl.appendChild(col);
      columns.push(col);
      heights.push(0);
    }

    GALLERY_PHOTOS.forEach((photo, index) => {
      const shortest = heights.indexOf(Math.min(...heights));

      const item = document.createElement("div");
      item.className = "gallery-item";
      item.dataset.index = index;

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt;
      img.loading = "lazy";

      item.appendChild(img);
      columns[shortest].appendChild(item);
      heights[shortest] += 1 / ratios[index];
    });
  }

  Promise.all(GALLERY_PHOTOS.map(loadRatio)).then((ratios) => {
    layoutGallery(ratios);

    let lastColumnCount = getColumnCount();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const count = getColumnCount();
        if (count !== lastColumnCount) {
          lastColumnCount = count;
          layoutGallery(ratios);
        }
      }, 150);
    });
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

  let lightboxTouchStartX = 0;
  let lightboxTouchStartY = 0;

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      lightboxTouchStartX = e.changedTouches[0].clientX;
      lightboxTouchStartY = e.changedTouches[0].clientY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      const deltaX = e.changedTouches[0].clientX - lightboxTouchStartX;
      const deltaY = e.changedTouches[0].clientY - lightboxTouchStartY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          showNext();
        } else {
          showPrev();
        }
      }
    },
    { passive: true }
  );
}

// ---------- Homepage hero slider ----------
const sliderEl = document.getElementById("heroSlider");

if (sliderEl && typeof SLIDER_PHOTOS !== "undefined" && SLIDER_PHOTOS.length) {
  SLIDER_PHOTOS.forEach((photo, index) => {
    const slide = document.createElement("div");
    slide.className = "slide" + (index === 0 ? " active" : "");
    slide.style.backgroundImage = `url('${photo.src}')`;

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > img.naturalHeight) {
        slide.classList.add("landscape-photo");
      } else if (img.naturalHeight > img.naturalWidth) {
        slide.classList.add("portrait-photo");
      }
    };
    img.src = photo.src;

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
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        goToSlide(index);
        resetAutoplay();
      });
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

    function prevSlide() {
      goToSlide((current - 1 + slides.length) % slides.length);
    }

    function startAutoplay() {
      timer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      clearInterval(timer);
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    startAutoplay();
    sliderEl.addEventListener("mouseenter", stopAutoplay);
    sliderEl.addEventListener("mouseleave", startAutoplay);

    sliderEl.addEventListener("click", (e) => {
      const rect = sliderEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX > rect.width / 2) {
        nextSlide();
      } else {
        prevSlide();
      }
      resetAutoplay();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        nextSlide();
        resetAutoplay();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
        resetAutoplay();
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;

    sliderEl.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );

    sliderEl.addEventListener(
      "touchend",
      (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            nextSlide();
          } else {
            prevSlide();
          }
          resetAutoplay();
        }
      },
      { passive: true }
    );
  }
}
