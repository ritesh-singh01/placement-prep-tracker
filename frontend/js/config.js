/**
 * API base URL for REST calls. When the app is served from the Express server
 * (e.g. http://localhost:5000/company.html), same-origin /api works.
 * Opening HTML from file:// falls back to localhost + PORT.
 */
(function () {
  var port = "5000";
  if (typeof window === "undefined") return;

  function resolve() {
    var o = window.location && window.location.origin;
    if (!o || o === "null" || (window.location.protocol && window.location.protocol === "file:")) {
      return "http://localhost:" + port + "/api";
    }
    return o + "/api";
  }

  window.APP_API_BASE = resolve();
})();
