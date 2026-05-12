/**
 * API base URL for REST calls. When the app is served from the Express server
 * (e.g. http://localhost:5000/company.html), same-origin /api works.
 * Opening HTML from file:// falls back to localhost + PORT.
 */
(function () {
  if (typeof window === "undefined") return;

  function resolve() {
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || !hostname;
    
    if (isLocal) {
      return "http://localhost:5000/api";
    }
    return "/api";
  }

  window.APP_API_BASE = resolve();
})();

