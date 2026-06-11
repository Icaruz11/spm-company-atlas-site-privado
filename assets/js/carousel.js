(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initCarousel = (root) => {
    const viewport = root.querySelector("[data-carousel-viewport]");
    const track = root.querySelector("[data-carousel-track]");
    const dotsHost = root.querySelector("[data-carousel-dots]");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    if (!viewport || !track || !dotsHost) return;

    const slides = Array.from(track.querySelectorAll(".card-carousel__slide"));
    if (slides.length === 0) return;

    const interval = Number(root.dataset.carouselInterval) || 10000;
    root.style.setProperty("--carousel-interval", `${interval}ms`);

    let activeIndex = 0;
    let autoTimer = null;
    let paused = false;

    const slideAt = (index) => slides[Math.max(0, Math.min(slides.length - 1, index))];

    const updateActive = (index) => {
      activeIndex = index;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      const dotEls = dotsHost.querySelectorAll(".card-carousel__dot");
      dotEls.forEach((dot, i) => {
        const isActive = i === index;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
        dot.tabIndex = isActive ? 0 : -1;
      });
    };

    const goTo = (index, behavior = "smooth") => {
      const safe = ((index % slides.length) + slides.length) % slides.length;
      const target = slideAt(safe);
      if (!target) return;
      track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior });
      updateActive(safe);
      restartAuto();
    };

    const startAuto = () => {
      if (prefersReducedMotion()) return;
      stopAuto();
      autoTimer = window.setInterval(() => {
        if (paused) return;
        const next = (activeIndex + 1) % slides.length;
        goTo(next);
      }, interval);
    };

    const stopAuto = () => {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    };

    const restartAuto = () => {
      stopAuto();
      startAuto();
    };

    slides.forEach((slide, i) => {
      const dot = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card-carousel__dot";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-label", `Ir para o item ${i + 1}`);
      button.addEventListener("click", () => goTo(i));
      dot.appendChild(button);
      dotsHost.appendChild(dot);
    });
    const dotButtons = dotsHost.querySelectorAll(".card-carousel__dot");

    if (prevBtn) prevBtn.addEventListener("click", () => goTo(activeIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => goTo(activeIndex + 1));

    let scrollDebounce = null;
    track.addEventListener("scroll", () => {
      if (scrollDebounce) window.clearTimeout(scrollDebounce);
      scrollDebounce = window.setTimeout(() => {
        const trackRect = track.getBoundingClientRect();
        const center = trackRect.left + trackRect.width / 2;
        let bestIndex = activeIndex;
        let bestDistance = Infinity;
        slides.forEach((slide, i) => {
          const rect = slide.getBoundingClientRect();
          const slideCenter = rect.left + rect.width / 2;
          const dist = Math.abs(slideCenter - center);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestIndex = i;
          }
        });
        if (bestIndex !== activeIndex) updateActive(bestIndex);
      }, 80);
    }, { passive: true });

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", resume);
    track.addEventListener("touchstart", () => { paused = true; }, { passive: true });
    track.addEventListener("touchend", () => {
      window.setTimeout(() => { paused = false; restartAuto(); }, 400);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    updateActive(0);
    window.requestAnimationFrame(() => {
      goTo(0, "auto");
      startAuto();
    });

    if (dotButtons[0]) dotButtons[0].tabIndex = 0;
  };

  ready(() => {
    document.querySelectorAll("[data-carousel]").forEach(initCarousel);
  });
})();
