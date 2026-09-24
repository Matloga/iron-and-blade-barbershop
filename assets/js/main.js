/* ============================================================
   IRON & BLADE — shared site behaviour
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.addEventListener("DOMContentLoaded", function () { init(); });

  function init() {
    headerScroll();
    mobileMenu();
    activeNav();
    footerYear();
    reveals();
    counters();
    initPopup();
    availability();
  }

  /* ---- Sticky header state ---- */
  function headerScroll() {
    var header = $("#siteHeader");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile menu ---- */
  function mobileMenu() {
    var toggle = $("#navToggle");
    var menu = $("#mobileMenu");
    var closeBtn = $("#mobileClose");
    var backdrop = $("#menuBackdrop");
    if (!toggle || !menu) return;

    var open = function () {
      menu.classList.add("is-open");
      backdrop.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.style.overflow = "hidden";
    };
    var close = function () {
      menu.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
    };

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) { close(); } else { open(); }
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);
    $$("a", menu).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) close();
    });
  }

  /* ---- Highlight current section in nav ---- */
  function activeNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    $$(".site-nav > a, .mobile-nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path) {
        a.setAttribute("aria-current", "page");
        if (a.closest(".mobile-nav")) a.style.color = "";
      }
    });
  }

  /* ---- Footer year ---- */
  function footerYear() {
    var el = $("#js-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---- Reveal on scroll ---- */
  function reveals() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- Animated counters ---- */
  function counters() {
    var els = $$("[data-count]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1200;
        var start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---- Welcome popup (20% first-visit) ---- */
  function initPopup() {
    var popup = $("#offerPopup");
    var openBtn = $("#openPopup");
    var closeBtn = $("#popupClose");
    if (!popup) return;
    var KEY = "ib_popup_seen";
    var shownAt = 0;
    try { shownAt = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { shownAt = 0; }
    var ONE_DAY = 86400000;
    var path = (window.location.pathname.split("/").pop() || "index.html");
    var suppressAuto = path === "booking.html";

    var open = function () {
      popup.classList.add("is-open");
      popup.setAttribute("aria-hidden", "false");
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ignore */ }
      if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    };
    var close = function () {
      popup.classList.remove("is-open");
      popup.setAttribute("aria-hidden", "true");
      if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    };

    if (!suppressAuto && shownAt < Date.now() - ONE_DAY) {
      setTimeout(open, 1600);
    }
    if (closeBtn) closeBtn.addEventListener("click", close);
    var backdrop = $(".popup-backdrop", popup);
    if (backdrop) backdrop.addEventListener("click", close);
    if (openBtn) openBtn.addEventListener("click", open);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && popup.classList.contains("is-open")) close();
    });
  }

  /* ---- Opening-hours widget (hero) ---- */
  function availability() {
    var title = $("#availabilityTitle");
    var text = $("#availabilityText");
    if (!title || !text) return;
    if (!window.IB || !IB.hours) return;
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var info = IB.hours[day];
    var OPEN_HTML = "We're <b>open</b>";
    if (!info || info.open == null) {
      title.textContent = "Closed today";
      text.innerHTML = "We open again tomorrow at 8:30 AM. Book ahead so you don't wait.";
      return;
    }
    var openMins = info.open * 60;
    var closeMins = info.close * 60;
    if (mins >= openMins && mins <= closeMins) {
      title.innerHTML = OPEN_HTML;
      var remain = closeMins - mins;
      var hrs = Math.floor(remain / 60);
      var mns = remain % 60;
      var until = (hrs ? hrs + "h " : "") + mns + "m";
      text.textContent = "Chairs are rolling until " + minutesToAmPm(closeMins) + " (" + until + " left). Walk in or book to skip the wait.";
    } else {
      title.textContent = "Closed right now";
      text.innerHTML = mins < openMins ? "We open at " + minutesToAmPm(openMins) + " today — book online so you don't wait." : "We're closed for the day. Book your next cut online anytime.";
    }
  }

  function minutesToAmPm(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }

  /* Expose a few utilities used elsewhere (booking page). */
  window.IB = window.IB || {};
  window.IB.ui = window.IB.ui || {};
  window.IB.ui.$ = $;
  window.IB.ui.$$ = $$;
})();