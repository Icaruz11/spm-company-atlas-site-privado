!function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = "2.0";
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
}(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

fbq("init", "1899907434017840");
fbq("track", "PageView");

(function () {
  var ds = document.body && document.body.dataset;
  if (!ds) return;
  if (ds.trackCompleteRegistration === "true") {
    fbq("track", "CompleteRegistration", {
      content_name: ds.completeRegistrationName || "Obrigado",
    });
  }
  if (ds.page === "home" && ds.trackViewContent === "true") {
    fbq("track", "ViewContent", {
      content_name: "SPM Company - Protocolo ATLAS",
      content_category: "Landing Page",
    });
  }
})();
