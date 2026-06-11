(function () {
  var w = window;
  var d = document;

  if (!w.fbq || !w.fbq.loaded) {
    var n = w.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
  }

  if (!d.querySelector('script[data-fbevents]')) {
    var t = d.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    t.setAttribute("data-fbevents", "1");
    var s = d.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(t, s);
  }

  w.fbq("init", "1899907434017840");
  w.fbq("track", "PageView");

  var ds = d.body && d.body.dataset;
  if (ds) {
    if (ds.trackCompleteRegistration === "true") {
      w.fbq("track", "CompleteRegistration", {
        content_name: ds.completeRegistrationName || "Obrigado",
      });
    }
    if (ds.page === "home" && ds.trackViewContent === "true") {
      w.fbq("track", "ViewContent", {
        content_name: "SPM Company - Protocolo ATLAS",
        content_category: "Landing Page",
      });
    }
  }
})();
