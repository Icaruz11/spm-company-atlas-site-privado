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
    if (value === consentRejected) {
      disablePixel();
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
    if (!isConfigured() || pixelLoaded) return;
    if (getConsent() === consentRejected) return;

    pixelLoaded = true;
    installFbqStub();

    const fire = () => {
      window.fbq("init", config.pixelId);
      window.fbq("track", "PageView");

      const page = document.body?.dataset.page;
      const viewContent = document.body?.dataset.trackViewContent === "true";
      const completeRegistration =
        document.body?.dataset.trackCompleteRegistration === "true";

      if (page === "home" && viewContent) {
        window.fbq("track", "ViewContent", {
          content_name: config.siteName || config.brandName || "SPM Company",
          content_category: "Landing Page",
        });
      }

      if (completeRegistration) {
        window.fbq("track", "CompleteRegistration", {
          content_name: "Obrigado",
        });
      }
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

  const clearMetaCookies = () => {
    const cookies = ["_fbp", "_fbc"];
    const host = location.hostname;
    const parts = host.split(".");
    const domains = [host];
    if (parts.length > 1) domains.push("." + parts.slice(-2).join("."));

    cookies.forEach((name) => {
      domains.forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
      });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  };

  const disablePixel = () => {
    if (typeof window.fbq === "function") {
      window.fbq("consent", "revoke");
    }
    clearMetaCookies();
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
    if (isConfigured() && getConsent() !== consentRejected) {
      loadPixel();
    }

    if (getConsent() === "pending") {
      showBanner();
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
