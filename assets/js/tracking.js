(() => {
  const config = window.SPM_CONFIG || {};
  const cookieKey = config.cookieKey || "spm_cookie_consent";
  const consentAccepted = "accepted";
  const consentRejected = "rejected";

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
      // ignore
    }
    syncBanner();
    if (value === consentRejected) {
      disablePixel();
    }
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

  const track = (eventName, params = {}, options) => {
    if (typeof window.fbq === "function") {
      if (options) {
        window.fbq("track", eventName, params, options);
      } else {
        window.fbq("track", eventName, params);
      }
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
    if (consent === "pending") {
      showBanner();
    } else {
      hideBanner();
    }
  };

  const initPageTracking = () => {
    if (getConsent() === consentRejected) {
      disablePixel();
      return;
    }

    if (getConsent() === "pending") {
      showBanner();
    }

    const page = document.body?.dataset.page;
    const viewContent = document.body?.dataset.trackViewContent === "true";
    if (page === "home" && viewContent && typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", {
        content_name: config.siteName || config.brandName || "SPM Company",
        content_category: "Landing Page",
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
    track,
    setConsent,
    getConsent,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initBanner();
    initPageTracking();
  });
})();
