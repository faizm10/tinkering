(function (global) {
  "use strict";

  var config = null;
  var queue = [];
  var flushTimer = null;
  var user = null;
  var STORAGE_PREFIX = "repopulse:";
  var SESSION_TIMEOUT = 30 * 60 * 1000;
  var MAX_BATCH = 50;

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
      var random = (Math.random() * 16) | 0;
      var value = char === "x" ? random : (random & 3) | 8;
      return value.toString(16);
    });
  }

  function storageKey(name) {
    return STORAGE_PREFIX + config.projectKey + ":" + name;
  }

  function read(name) {
    try {
      return global.localStorage.getItem(storageKey(name));
    } catch (_) {
      return null;
    }
  }

  function write(name, value) {
    try {
      global.localStorage.setItem(storageKey(name), value);
    } catch (_) {}
  }

  function remove(name) {
    try {
      global.localStorage.removeItem(storageKey(name));
    } catch (_) {}
  }

  function anonymousId() {
    var value = read("anonymous-id");
    if (!value) {
      value = uuid();
      write("anonymous-id", value);
    }
    return value;
  }

  function sessionId() {
    var now = Date.now();
    var lastActivity = Number(read("last-activity") || 0);
    var value = read("session-id");
    if (!value || now - lastActivity >= SESSION_TIMEOUT) {
      value = uuid();
      write("session-id", value);
    }
    write("last-activity", String(now));
    return value;
  }

  function utm() {
    var params = new URLSearchParams(global.location.search);
    var result = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(function (key) {
      var value = params.get(key);
      if (value) result[key] = value;
    });
    return result;
  }

  function canTrack() {
    return Boolean(config && config.consent);
  }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = global.setTimeout(function () {
      flushTimer = null;
      flush();
    }, 5000);
  }

  function buildEvent(name, properties) {
    return {
      id: uuid(),
      name: name,
      anonymousId: anonymousId(),
      sessionId: sessionId(),
      timestamp: new Date().toISOString(),
      userId: user && user.id ? user.id : undefined,
      traits: user && user.traits ? user.traits : undefined,
      path: global.location.pathname + global.location.search,
      referrer: document.referrer || undefined,
      properties: properties || {},
      utm: utm(),
    };
  }

  function track(name, properties) {
    if (!canTrack()) return false;
    queue.push(buildEvent(name, properties));
    if (queue.length >= MAX_BATCH) flush();
    else scheduleFlush();
    return true;
  }

  function identify(userId, traits) {
    if (!userId) throw new Error("RepoPulse.identify requires a user ID");
    user = { id: String(userId), traits: traits || {} };
    write("user", JSON.stringify(user));
    track("$identify", {});
  }

  function reset() {
    flush();
    user = null;
    remove("user");
    remove("anonymous-id");
    remove("session-id");
    remove("last-activity");
  }

  function flush() {
    if (!config || queue.length === 0 || !canTrack()) return Promise.resolve();
    var events = queue.splice(0, MAX_BATCH);
    var body = JSON.stringify({ projectKey: config.projectKey, events: events });

    return global
      .fetch(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": uuid(),
        },
        body: body,
        keepalive: true,
      })
      .then(function (response) {
        if (!response.ok && response.status >= 500) {
          queue = events.concat(queue).slice(0, 200);
          scheduleFlush();
        }
      })
      .catch(function () {
        queue = events.concat(queue).slice(0, 200);
        scheduleFlush();
      });
  }

  function init(options) {
    if (!options || !options.projectKey) throw new Error("RepoPulse.init requires projectKey");
    config = {
      projectKey: options.projectKey,
      endpoint: options.endpoint || "/api/ingest",
      consent: options.consent !== false,
    };

    try {
      user = JSON.parse(read("user") || "null");
    } catch (_) {
      user = null;
    }

    if (config.consent) track("$pageview", { title: document.title });

    global.addEventListener("popstate", function () {
      track("$pageview", { title: document.title });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });
    global.addEventListener("pagehide", flush);
  }

  function setConsent(consent) {
    config.consent = Boolean(consent);
    if (!config.consent) {
      queue = [];
      return;
    }
    track("$pageview", { title: document.title, consentGranted: true });
  }

  global.RepoPulse = {
    init: init,
    track: track,
    identify: identify,
    reset: reset,
    flush: flush,
    setConsent: setConsent,
  };
})(window);
