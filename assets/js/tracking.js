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

  const installFbqStub = () => {
    if (window.fbq) return;
    const n = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
  };

  const loadPixel = () => {
    if (!isConfigured() || pixelLoaded || getConsent() !== consentAccepted) {
      return;
    }

    pixelLoaded = true;
    installFbqStub();

    const fire = () => {
      window.fbq("init", config.pixelId);
      window.fbq("track", "PageView");
    };

    if (window.fbq && window.fbq.callMethod) {
      fire();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = fire;
    document.head.appendChild(script);
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
    if (isConfigured()) installFbqStub();

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
