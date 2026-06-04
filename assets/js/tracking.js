(() => {
  const config = window.SPM_CONFIG || {};
  const cookieKey = config.cookieKey || "spm_cookie_consent";
  const consentAccepted = "accepted";
  const consentRejected = "rejected";
  let pixelLoaded = false;

  const isConfigured = () =>
    Boolean(config.pixelId && !String(config.pixelId).includes("SEU_PIXEL_ID"));

  const getConsent = () => {
    try {
      return localStorage.getItem(cookieKey) || "pending";
    } catch {
      return "pending";
    }
  };

  const setConsent = (value) => {
    try {
      localStorage.setItem(cookieKey, value);
    } catch {
      // ignore storage errors
    }
    syncBanner();
    if (value === consentAccepted) {
      loadPixel();
    }
  };

  const loadPixel = () => {
    if (!isConfigured() || pixelLoaded || getConsent() !== consentAccepted) {
      return;
    }

    pixelLoaded = true;

    if (window.fbq) {
      window.fbq("init", config.pixelId);
      window.fbq("track", "PageView");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = () => {
      if (typeof window.fbq === "function") {
        window.fbq("init", config.pixelId);
        window.fbq("track", "PageView");
      }
    };
    document.head.appendChild(script);

    window.fbq =
      window.fbq ||
      function () {
        window.fbq.callMethod
          ? window.fbq.callMethod.apply(window.fbq, arguments)
          : window.fbq.queue.push(arguments);
      };
    if (!window._fbq) {
      window._fbq = window.fbq;
    }
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = "2.0";
    window.fbq.queue = window.fbq.queue || [];
  };

  const track = (eventName, params = {}) => {
    if (typeof window.fbq === "function" && pixelLoaded) {
      window.fbq("track", eventName, params);
    }
  };

  const showBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (banner) {
      banner.hidden = false;
      banner.classList.add("is-visible");
    }
  };

  const hideBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (banner) {
      banner.hidden = true;
      banner.classList.remove("is-visible");
    }
  };

  const syncBanner = () => {
    const consent = getConsent();
    const banner = document.querySelector("[data-cookie-banner]");
    if (!banner) return;

    if (consent === "pending") {
      showBanner();
      return;
    }

    hideBanner();
  };

  const initPageTracking = () => {
    if (getConsent() === consentAccepted) {
      loadPixel();
    } else if (getConsent() !== consentRejected) {
      showBanner();
    }

    const page = document.body?.dataset.page;
    const viewContent = document.body?.dataset.trackViewContent === "true";
    const completeRegistration =
      document.body?.dataset.trackCompleteRegistration === "true";

    if (pixelLoaded && page === "home" && viewContent) {
      track("ViewContent", {
        content_name: config.siteName || config.brandName || "SPM Company",
        content_category: "Landing Page",
      });
    }

    if (pixelLoaded && completeRegistration) {
      track("CompleteRegistration", {
        content_name: "Obrigado",
      });
    }
  };

  const initBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (!banner) return;

    const accept = banner.querySelector("[data-accept-cookies]");
    const reject = banner.querySelector("[data-reject-cookies]");

    accept?.addEventListener("click", () => setConsent(consentAccepted));
    reject?.addEventListener("click", () => setConsent(consentRejected));
  };

  window.SPMTracker = {
    loadPixel,
    track,
    setConsent,
    getConsent,
    isConfigured,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initBanner();
    initPageTracking();
  });
})();
