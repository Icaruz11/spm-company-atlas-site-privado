(() => {
  const config = window.SPM_CONFIG || {};
  const cookieKey = config.cookieKey || "spm_cookie_consent";
  const consentAccepted = "accepted";
  const consentRejected = "rejected";

  // O Pixel dispara incondicionalmente (assets/js/pixel.js). Este módulo NÃO
  // faz gate de consentimento: o rastreio fica ativo em qualquer página e a
  // qualquer momento, por decisão de negócio. O banner de cookies foi removido
  // do markup; a lógica de banner abaixo é defensiva (no-op se não existir) e
  // nunca desativa o Pixel.

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
    hideBanner();
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

  const hideBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (banner) {
      banner.hidden = true;
      banner.classList.remove("is-visible");
    }
  };

  const initBanner = () => {
    const banner = document.querySelector("[data-cookie-banner]");
    if (!banner) return;

    const accept = banner.querySelector("[data-accept-cookies]");
    const reject = banner.querySelector("[data-reject-cookies]");

    // Ambos os botões apenas registram a preferência e escondem o aviso.
    // Nenhum deles desativa o Pixel.
    accept?.addEventListener("click", () => setConsent(consentAccepted));
    reject?.addEventListener("click", () => setConsent(consentRejected));
  };

  window.SPMTracker = {
    track,
    setConsent,
    getConsent,
  };

  document.addEventListener("DOMContentLoaded", initBanner);
})();
