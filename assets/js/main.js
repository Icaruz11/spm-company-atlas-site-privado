(() => {
  const config = window.SPM_CONFIG || {};

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  ready(() => {
    const header = document.querySelector("[data-site-header]");
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-site-nav]");
    const year = document.querySelector("[data-current-year]");
    const revealTargets = document.querySelectorAll("[data-reveal]");
    const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
    const instagramLinks = document.querySelectorAll("[data-instagram-link]");

    if (year) {
      year.textContent = new Date().getFullYear().toString();
    }

    const resolvedWhatsAppHref =
      config.whatsappUrl && !String(config.whatsappUrl).includes("SEU_")
        ? config.whatsappUrl
        : "#diagnostico";

    whatsappLinks.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.href = resolvedWhatsAppHref;
      if (resolvedWhatsAppHref.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noreferrer noopener";
      } else {
        link.removeAttribute("target");
        link.removeAttribute("rel");
      }
    });

    const resolvedInstagramHref =
      config.instagramUrl && !String(config.instagramUrl).includes("SEU_")
        ? config.instagramUrl
        : "https://www.instagram.com/spmcompany_/";

    instagramLinks.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.href = resolvedInstagramHref;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    });

    const closeMenu = () => {
      if (!menu || !toggle) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };

    toggle?.addEventListener("click", () => {
      if (!menu || !toggle) return;
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });

    menu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 900) {
          closeMenu();
        }
      });
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest("[data-site-header]")) {
        closeMenu();
      }
    });

    window.addEventListener("scroll", () => {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    });

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -80px 0px" },
      );

      revealTargets.forEach((el) => observer.observe(el));
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", id);
      });
    });
  });
})();
