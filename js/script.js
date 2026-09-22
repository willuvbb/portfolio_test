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

// ---------- Homepage title: shrink-to-fit on one line ----------
// CSS alone can't reliably predict how wide rendered text will be (it
// depends on the actual font metrics), so this measures the real
// rendered width and steps the font size down until it fits — rather
// than wrapping to a second line or overflowing the viewport.
const homeTitle = document.querySelector(".home-intro h1");

if (homeTitle) {
  const maxFontSize = 32; // px, matches the 2rem CSS default
  const minFontSize = 14; // px floor so it never becomes illegible

  function fitHomeTitle() {
    homeTitle.style.whiteSpace = "nowrap";
    let fontSize = maxFontSize;
    homeTitle.style.fontSize = fontSize + "px";
    while (homeTitle.scrollWidth > homeTitle.clientWidth && fontSize > minFontSize) {
      fontSize -= 1;
      homeTitle.style.fontSize = fontSize + "px";
    }
  }

  fitHomeTitle();

  let titleResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(titleResizeTimer);
    titleResizeTimer = setTimeout(fitHomeTitle, 150);
  });
}

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

// ---------- Gallery + lightbox (wildlife.html, nature-and-light.html, etc.) ----------
// Note: the gallery markup already in the page HTML (written by
// tools/generate-static.js from photos.js) is a static, search-engine-
// visible seed. JS below replaces it with a true masonry layout —
// each photo goes into whichever column is currently shortest, based on
// its real aspect ratio, which CSS column-count can't do (it only
// estimates one target height and dumps overflow into the last column).
const galleryEl = document.getElementById("gallery");

if (galleryEl && typeof GALLERY_PHOTOS !== "undefined") {
  function getColumnCount() {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 900) return 2;
    return 3;
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

      const item = document.createElement("button");
      item.type = "button";
      item.className = "gallery-item";
      item.dataset.index = index;
      item.setAttribute("aria-label", `View larger photo: ${photo.alt}`);

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
  const focusableInLightbox = [lightboxClose, lightboxPrev, lightboxNext];

  let currentIndex = 0;
  let lightboxTriggerEl = null;

  function updateLightboxImage() {
    const photo = GALLERY_PHOTOS[currentIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
  }

  function openLightbox(index, triggerEl) {
    currentIndex = index;
    lightboxTriggerEl = triggerEl || document.activeElement;
    updateLightboxImage();
    lightbox.classList.add("active");
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    if (lightboxTriggerEl) lightboxTriggerEl.focus();
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
    if (item) openLightbox(Number(item.dataset.index), item);
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", showPrev);
  lightboxNext.addEventListener("click", showNext);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Focus trap: while the lightbox is open, Tab/Shift+Tab cycle only
  // through its own controls instead of escaping into the page behind it.
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;

    if (e.key === "Escape") {
      closeLightbox();
      return;
    }
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();

    if (e.key === "Tab") {
      const currentPos = focusableInLightbox.indexOf(document.activeElement);
      const nextPos = e.shiftKey
        ? (currentPos <= 0 ? focusableInLightbox.length - 1 : currentPos - 1)
        : (currentPos === -1 || currentPos === focusableInLightbox.length - 1 ? 0 : currentPos + 1);
      e.preventDefault();
      focusableInLightbox[nextPos].focus();
    }
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
// The slides themselves (real <img> tags, with alt text, one per photo)
// are already in the page HTML — written by tools/generate-static.js so
// that the photos and their captions exist in the DOM before any JS runs.
// This block only wires up the interactive parts: dots, autoplay, a
// pause control, and swipe/keyboard navigation.
const sliderEl = document.getElementById("heroSlider");

if (sliderEl) {
  const slides = sliderEl.querySelectorAll(".slide");

  if (slides.length > 1) {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const controls = document.createElement("div");
    controls.className = "slider-controls";

    const pauseBtn = document.createElement("button");
    pauseBtn.type = "button";
    pauseBtn.className = "slide-pause";
    controls.appendChild(pauseBtn);

    const dots = document.createElement("div");
    dots.className = "slide-dots";
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slide-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        goToSlide(index);
        resetAutoplay();
      });
      dots.appendChild(dot);
    });
    controls.appendChild(dots);
    sliderEl.appendChild(controls);

    const dotEls = dots.querySelectorAll(".slide-dot");
    let current = 0;
    let timer;
    // Homepage autoplay honors prefers-reduced-motion the same way the
    // logo intro animation already does: motion-sensitive visitors get
    // a static first slide plus full manual control (dots/arrows/swipe).
    let isPlaying = !reduceMotionQuery.matches;

    function updatePauseButton() {
      pauseBtn.textContent = isPlaying ? "❚❚" : "▶";
      pauseBtn.setAttribute("aria-label", isPlaying ? "Pause slideshow" : "Play slideshow");
    }

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
      clearInterval(timer);
      timer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      clearInterval(timer);
    }

    function resetAutoplay() {
      if (isPlaying) startAutoplay();
    }

    pauseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isPlaying = !isPlaying;
      updatePauseButton();
      if (isPlaying) {
        startAutoplay();
      } else {
        stopAutoplay();
      }
    });

    updatePauseButton();
    if (isPlaying) startAutoplay();

    reduceMotionQuery.addEventListener("change", (e) => {
      if (e.matches && isPlaying) {
        isPlaying = false;
        stopAutoplay();
        updatePauseButton();
      }
    });

    sliderEl.addEventListener("mouseenter", stopAutoplay);
    sliderEl.addEventListener("mouseleave", resetAutoplay);

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
