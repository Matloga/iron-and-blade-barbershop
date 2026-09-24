/* ============================================================
   IRON & BLADE — booking wizard + calendar integration
   ============================================================ */
(function () {
  "use strict";

  var $ = window.IB.ui.$;
  var $$ = window.IB.ui.$$;

  var STORE_KEY = "ib_bookings";
  var SLOT_STEP = 30; // minutes between slot starts

  var state = {
    step: 1,
    serviceId: null,
    barberId: null,
    date: null,   // YYYY-MM-DD
    time: null,   // HH:MM
    name: "",
    email: "",
    phone: "",
    notes: ""
  };

  var wizard = null;

  document.addEventListener("DOMContentLoaded", function () {
    wizard = $("#bookingWizard");
    if (!wizard) return;
    readUrlPrefills();
    buildStepIndicators();
    renderServicesStep();
    bindDetailForm();
    bindStepNav();
    renderSidebar();
    goTo(1);
  });

  function readUrlPrefills() {
    try {
      var q = new URLSearchParams(window.location.search);
      var s = q.get("service");
      if (s && IB.getService(s)) state.serviceId = s;
      var b = q.get("barber");
      if (b && IB.getBarber(b)) state.barberId = b;
    } catch (e) { /* ignore */ }
  }

  /* ---------------- Step indicators ---------------- */
  var STEPS = ["Service", "Date & Time", "Your Details"];

  function buildStepIndicators() {
    var wrap = $(".steps-progress", wizard);
    if (!wrap) return;
    wrap.innerHTML = STEPS.map(function (label, i) {
      return '<div class="step-dot" data-step="' + (i + 1) + '" aria-hidden="true"><span>' + label + "</span></div>";
    }).join("");
    syncSteps();
  }

  function syncSteps() {
    $$(".step-dot", wizard).forEach(function (dot, i) {
      dot.classList.toggle("is-active", i + 1 === state.step);
      dot.classList.toggle("is-done", i + 1 < state.step);
    });
  }

  function goTo(step) {
    state.step = step;
    $$(".wizard-step", wizard).forEach(function (panel) {
      panel.classList.remove("is-active");
    });
    var panel = $("#step-" + step);
    if (panel) panel.classList.add("is-active");
    syncSteps();
    window.scrollTo({ top: Math.min(wizard.getBoundingClientRect().top + window.scrollY - 90, window.scrollY), behavior: "smooth" });
  }

  /* ---------------- Step 1: services ---------------- */
  function renderServicesStep() {
    var wrap = $("#servicesGrid");
    if (!wrap) return;
    var html = "";
    IB.categories.forEach(function (cat) {
      html += '<div class="svc-cat" data-cat="' + cat.id + '" style="margin-bottom:26px">';
      if (cat.id === "hair") {
        html += '<div class="svc-hint" style="margin-bottom:14px;font-size:13px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;font-weight:700">First, pick a service</div>';
      }
      html += '<div class="option-grid">';
      IB.services.filter(function (s) { return s.cat === cat.id; }).forEach(function (s) {
        var pop = s.popular ? '<span class="tag-popular" style="font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);background:var(--gold);padding:2px 8px;border-radius:999px">Popular</span>' : "";
        html +=
          '<div class="option-card">' +
          '<label for="svc-' + s.id + '">' +
          '<div class="oc-head"><h3>' + s.name + " " + pop + "</h3><span class='oc-price'>R" + s.price + "</span></div>" +
          "<p>" + s.desc + "</p>" +
          '<span class="oc-dur">' + s.duration + " min &middot; per visit</span>" +
          "</label>" +
          '<input type="radio" name="service" id="svc-' + s.id + '" value="' + s.id + '"' + (state.serviceId === s.id ? " checked" : "") + ">" +
          "</div>";
      });
      html += "</div></div>";
    });
    wrap.innerHTML = html;
    $$('input[name="service"]', wrap).forEach(function (input) {
      input.addEventListener("change", function () {
        state.serviceId = input.value;
        state.time = null;
        renderTimeSlots();
      });
    });
  }

  /* ---------------- Step 2: barber, date, time ---------------- */
  function renderBarbers() {
    var wrap = $("#barberGrid");
    if (!wrap) return;
    var html =
      '<div class="option-card" style="border-radius:999px">' +
      '<label for="barber-none" style="display:flex;align-items:center;gap:14px">' +
      '<strong style="font-size:15px">No preference</strong>' +
      '<span style="font-size:12.5px;color:var(--muted)">First available barber</span></label>' +
      '<input type="radio" name="barber" id="barber-none" value=""' + (!state.barberId ? " checked" : "") + "></div>";
    IB.barbers.forEach(function (b) {
      html +=
        '<div class="option-card">' +
        '<label for="barber-' + b.id + '">' +
        '<div class="oc-head"><h3>' + b.name + "</h3><span class='oc-price' style='font-size:16px'>" + b.role.split(" ").slice(0, 2).join(" ") + "</span></div>" +
        "<p>" + b.specialty + "</p>" +
        '<span class="oc-dur">' + b.experience + " years experience</span>" +
        "</label>" +
        '<input type="radio" name="barber" id="barber-' + b.id + '" value="' + b.id + '"' + (state.barberId === b.id ? " checked" : "") + ">" +
        "</div>";
    });
    wrap.innerHTML = html;
    $$('input[name="barber"]', wrap).forEach(function (input) {
      input.addEventListener("change", function () {
        state.barberId = input.value || null;
        renderTimeSlots();
      });
    });
  }

  function renderDates() {
    var wrap = $("#dateGrid");
    if (!wrap) return;
    var html = "";
    var today = new Date();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (var i = 1; i <= 14; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      var day = d.getDay();
      var dayInfo = IB.hours[day];
      if (day === 0) continue; // closed Sunday
      var ymd = fmtDate(d);
      html +=
        '<div class="date-option">' +
        '<label for="date-' + ymd + '">' +
        '<span class="dow">' + dayNames[day] + "</span>" +
        '<span class="dnum">' + d.getDate() + "</span>" +
        '<span class="dmon">' + monthNames[d.getMonth()] + "</span></label>" +
        '<input type="radio" name="bookdate" id="date-' + ymd + '" value="' + ymd + '"' + (state.date === ymd ? " checked" : "") + ">" +
        '<span style="display:none">' + dayInfo.label + "</span>" +
        "</div>";
    }
    wrap.innerHTML = html;
    $$('input[name="bookdate"]', wrap).forEach(function (input) {
      input.addEventListener("change", function () {
        state.date = input.value;
        state.time = null;
        renderTimeSlots();
      });
    });
  }

  function fmtDate(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function minutesToLabel(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
  }

  function getBookings() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }

  function saveBooking(b) {
    var all = getBookings();
    all.push(b);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }

  function deleteBooking(ref) {
    var all = getBookings().filter(function (b) { return b.ref !== ref; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }

  function buildSlots(dateYmd) {
    var svc = IB.getService(state.serviceId);
    if (!svc) return [];
    var d = new Date(dateYmd + "T00:00:00");
    var day = d.getDay();
    var info = IB.hours[day];
    if (!info || info.open == null) return [];
    var dur = svc.duration;
    var lastStart = info.close * 60 - dur;
    var slots = [];
    for (var t = info.open * 60; t <= lastStart; t += SLOT_STEP) {
      slots.push(t);
    }
    // Block past slots for today
    var now = new Date();
    if (dateYmd === fmtDate(now)) {
      var nowMins = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter(function (t) { return t > nowMins + 15; });
    }
    // Block slots occupied by existing bookings (same barber, or any barber when no preference)
    var bookings = getBookings();
    var busy = bookings.filter(function (b) {
      if (b.date !== dateYmd) return false;
      if (state.barberId && b.barberId !== state.barberId) return false;
      return true;
    }).map(function (b) {
      var infoSvc = IB.getService(b.serviceId) || { duration: 30 };
      return { start: toMinutes(b.time), end: toMinutes(b.time) + infoSvc.duration };
    });
    return slots.map(function (t) {
      var conflict = busy.some(function (b) { return t < b.end && t + dur > b.start; });
      return { start: t, disabled: conflict };
    });
  }

  function toMinutes(hm) {
    var parts = hm.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function renderTimeSlots() {
    var wrap = $("#timeGrid");
    var empty = $("#timeEmpty");
    if (!wrap) { updateTimeHint(); return; }
    var svc = IB.getService(state.serviceId);
    if (state.date && svc) {
      var slots = buildSlots(state.date);
      if (slots.length) {
        wrap.innerHTML = slots.map(function (s) {
          var hm = minutesToHM(s.start);
          return (
            '<div class="time-chip">' +
            '<input type="radio" name="slot" id="slot-' + hm.replace(":", "") + '" value="' + hm + '"' +
            (state.time === hm ? " checked" : "") + (s.disabled ? " disabled" : "") + ">" +
            '<label for="slot-' + hm.replace(":", "") + '">' + minutesToLabel(s.start) + "</label></div>"
          );
        }).join("");
        $$('input[name="slot"]', wrap).forEach(function (input) {
          input.addEventListener("change", function () { state.time = input.value; });
        });
        wrap.style.display = "grid";
        if (empty) empty.style.display = "none";
      } else {
        wrap.innerHTML = "";
        wrap.style.display = "none";
        if (empty) empty.style.display = "flex";
      }
    } else {
      wrap.innerHTML = "";
      wrap.style.display = "none";
      if (empty) empty.style.display = "flex";
      if (empty && (!state.date || !svc)) {
        empty.innerHTML = "<p>Choose a service and a date above to see available times.</p>";
      }
    }
    updateTimeHint();
  }

  function updateTimeHint() {
    var hint = $("#timeHint");
    if (!hint) return;
    var svc = IB.getService(state.serviceId);
    hint.textContent = svc ? "Booking length " + svc.duration + " min. All times are shop local (SAST)." : "Select a service to reveal availability.";
  }

  function minutesToHM(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  /* ---------------- Step 3: details + review ---------------- */
  function renderReview() {
    var svc = IB.getService(state.serviceId);
    var barber = state.barberId ? IB.getBarber(state.barberId) : null;
    var wrap = $("#reviewBox");
    if (!wrap) return;
    var d = new Date(state.date + "T00:00:00");
    var prettyDate = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    wrap.innerHTML =
      '<div class="rv"><dt>Service</dt><dd>' + (svc ? svc.name : "—") + "</dd></div>" +
      '<div class="rv"><dt>Barber</dt><dd>' + (barber ? barber.name : "First available barber") + "</dd></div>" +
      '<div class="rv"><dt>When</dt><dd>' + prettyDate + " at " + (state.time ? minutesToLabel(toMinutes(state.time)) : "—") + "</dd></div>" +
      '<div class="rv"><dt>Where</dt><dd>' + IB.brand.addressShort + "</dd></div>" +
      '<div class="rv"><dt>Duration</dt><dd>' + (svc ? svc.duration + " minutes" : "—") + "</dd></div>" +
      '<div class="rv rv-total"><dt>Total</dt><dd>' + (svc ? "R" + svc.price : "—") + "</dd></div>";
  }

  function bindDetailForm() {
    var name = $("#bkName"), email = $("#bkEmail"), phone = $("#bkPhone"), notes = $("#bkNotes");
    if (name) name.addEventListener("input", function () { state.name = name.value; clearErr(name); });
    if (email) email.addEventListener("input", function () { state.email = email.value.trim(); clearErr(email); });
    if (phone) phone.addEventListener("input", function () { state.phone = phone.value.trim(); clearErr(phone); });
    if (notes) notes.addEventListener("input", function () { state.notes = notes.value; });
  }

  function markErr(inputEl) {
    if (inputEl) inputEl.closest(".field").classList.add("is-error");
  }
  function clearErr(inputEl) {
    if (inputEl) inputEl.closest(".field").classList.remove("is-error");
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function validateDetails() {
    var ok = true;
    var name = $("#bkName"), email = $("#bkEmail"), phone = $("#bkPhone");
    if (!state.name || state.name.length < 2) { markErr(name); ok = false; } else clearErr(name);
    if (!validEmail(state.email)) { markErr(email); ok = false; } else clearErr(email);
    if (!/^[+0-9 ()-]{7,18}$/.test(state.phone)) { markErr(phone); ok = false; } else clearErr(phone);
    return ok;
  }

  /* ---------------- Wizard navigation ---------------- */
  function bindStepNav() {
    wizard.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "next") onNext(btn);
      if (action === "back") goTo(state.step - 1);
      if (action === "confirm") onConfirm(btn);
      if (action === "restart") onRestart();
      if (action === "cancel") onCancel(btn.getAttribute("data-ref"));
    });
  }

  function onNext(btn) {
    if (state.step === 1) {
      if (!state.serviceId) { flashError(btn, "Choose a service to continue"); return; }
      renderBarbers();
      renderDates();
      renderTimeSlots();
      goTo(2);
    } else if (state.step === 2) {
      if (!state.date) { flashError(btn, "Pick a date"); return; }
      if (!state.time) { flashError(btn, "Pick a time for your appointment"); return; }
      renderReview();
      goTo(3);
    }
  }

  function flashError(btn, msg) {
    var old = btn.textContent;
    btn.classList.add("btn--outline");
    btn.textContent = msg;
    btn.style.color = "#ef8f78";
    btn.style.borderColor = "#ef8f78";
    setTimeout(function () {
      btn.classList.remove("btn--outline");
      btn.textContent = old;
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 1600);
  }

  function onConfirm(btn) {
    if (!validateDetails()) return;
    var svc = IB.getService(state.serviceId);
    var booking = {
      ref: makeRef(),
      serviceId: state.serviceId,
      serviceName: svc.name,
      price: svc.price,
      barberId: state.barberId,
      barberName: state.barberId ? IB.getBarber(state.barberId).name : "First available barber",
      date: state.date,
      time: state.time,
      name: state.name,
      email: state.email,
      phone: state.phone,
      notes: state.notes,
      createdAt: new Date().toISOString()
    };
    saveBooking(booking);
    renderSuccess(booking);
    renderSidebar();
    goTo(4);
  }

  function makeRef() {
    var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var out = "";
    for (var i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return "IB-" + out;
  }

  /* ---------------- Success + calendar ---------------- */
  function renderSuccess(booking) {
    var panel = $("#step-4");
    if (!panel) return;
    var svc = IB.getService(booking.serviceId);
    var startUtc = saLocalToUtc(booking.date, booking.time);
    var endUtc = saLocalToUtc(booking.date, addMinutes(booking.time, svc.duration));

    var gurl = googleCalendarUrl(booking, svc, startUtc, endUtc);

    var d = new Date(booking.date + "T00:00:00");
    var prettyDate = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    panel.querySelector(".js-ref").textContent = booking.ref;
    var summary = panel.querySelector(".js-summary");
    if (summary) {
      summary.innerHTML =
        "<strong>" + escapeHtml(booking.serviceName) + "</strong> — " +
        "<span>" + prettyDate + " at " + minutesToLabel(toMinutes(booking.time)) + "</span> &middot; " +
        "<span>" + escapeHtml(booking.barberName) + "</span> &middot; " +
        "<span>R" + booking.price + "</span>";
    }

    var calWrap = panel.querySelector(".js-calendar");
    if (calWrap) {
      calWrap.innerHTML =
        '<a class="cal-btn" href="' + gurl + '" target="_blank" rel="noopener">' +
        '  <span class="cb-icon cb-icon--g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg></span>' +
        '  <span><strong>Add to Google Calendar</strong><span>Opens a calendar invite with your exact appointment.</span></span>' +
        "</a>" +
        '<button class="cal-btn" type="button" data-action="download-ics">' +
        '  <span class="cb-icon cb-icon--a"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/><path d="M12 12v5M10 14.5 12 15l2-.5" stroke-linecap="round"/></svg></span>' +
        '  <span><strong>Apple Calendar / Outlook (.ics)</strong><span>Download the event file — opens on iPhone, Mac and Outlook.</span></span>' +
        "</button>";
      var icsBtn = calWrap.querySelector('[data-action="download-ics"]');
      icsBtn.addEventListener("click", function () {
        downloadIcs(booking, svc, startUtc, endUtc);
      });
    }

    var remind = panel.querySelector(".js-cal-remind");
    if (remind) {
      remind.textContent = "Appointment: " + svc.name + " \u00b7 " + prettyDate + " at " + minutesToLabel(toMinutes(booking.time)) + " \u00b7 " + booking.barberName;
    }
  }

  function saLocalToUtc(ymd, hm) {
    var parts = ymd.split("-");
    var y = +parts[0], m = +parts[1], d = +parts[2];
    var t = hm.split(":");
    var hh = +t[0], mm = +t[1];
    var ms = Date.UTC(y, m - 1, d, hh, mm, 0) - 2 * 3600 * 1000; // Johannesburg = UTC+2, no DST
    var dt = new Date(ms);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return dt.getUTCFullYear() + p(dt.getUTCMonth() + 1) + p(dt.getUTCDate()) +
      "T" + p(dt.getUTCHours()) + p(dt.getUTCMinutes()) + "00Z";
  }

  function addMinutes(hm, mins) {
    var total = toMinutes(hm) + mins;
    return minutesToHM(total);
  }

  function googleCalendarUrl(booking, svc, startUtc, endUtc) {
    var text = svc.name + " at Iron & Blade Barbershop";
    var details = [
      "Appointment with " + booking.barberName + ".",
      "Booking reference: " + booking.ref,
      "Guest: " + booking.name,
      "Phone: " + booking.phone,
      (booking.notes ? "Notes: " + booking.notes : ""),
      "",
      "Iron & Blade Barbershop",
      IB.brand.address,
      "Tel: " + IB.brand.phone
    ].filter(Boolean).join("\n");
    var u = new URL("https://calendar.google.com/calendar/render");
    u.searchParams.set("action", "TEMPLATE");
    u.searchParams.set("text", text);
    u.searchParams.set("dates", startUtc + "/" + endUtc);
    u.searchParams.set("details", details);
    u.searchParams.set("location", IB.brand.address);
    u.searchParams.set("ctz", IB.brand.timezone);
    return u.toString();
  }

  function escapeIcsField(v) {
    return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function icsBlob(booking, svc, startUtc, endUtc) {
    var now = new Date();
    function zp(n) { return (n < 10 ? "0" : "") + n; }
    var stamp =
      now.getUTCFullYear() + zp(now.getUTCMonth() + 1) + zp(now.getUTCDate()) +
      "T" + zp(now.getUTCHours()) + zp(now.getUTCMinutes()) + zp(now.getUTCSeconds()) + "Z";
    var description = [
      "Appointment with " + booking.barberName + ".",
      "Booking reference: " + booking.ref,
      "Guest: " + booking.name,
      "Phone: " + booking.phone,
      (booking.notes ? "Notes: " + booking.notes : ""),
      "",
      "Iron & Blade Barbershop — " + IB.brand.address,
      "Tel: " + IB.brand.phone + " | " + IB.brand.email
    ].filter(Boolean).join("\n");

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Iron & Blade Barbershop//Booking " + booking.ref + "//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-TIMEZONE:" + IB.brand.timezone,
      "BEGIN:VEVENT",
      "UID:" + booking.ref + "@ironandblade.co.za",
      "DTSTAMP:" + stamp,
      "DTSTART:" + startUtc,
      "DTEND:" + endUtc,
      "SUMMARY:" + escapeIcsField(svc.name + " — Iron & Blade Barbershop"),
      "DESCRIPTION:" + escapeIcsField(description),
      "LOCATION:" + escapeIcsField(IB.brand.address),
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  }

  function downloadIcs(booking, svc, startUtc, endUtc) {
    var blob = icsBlob(booking, svc, startUtc, endUtc);
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "iron-blade-" + booking.ref + ".ics";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 400);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /* ---------------- Restart ---------------- */
  function onRestart() {
    state = { step: 1, serviceId: null, barberId: null, date: null, time: null, name: "", email: "", phone: "", notes: "" };
    try { window.history.replaceState({}, "", window.location.pathname); } catch (e) { /* ignore */ }
    renderServicesStep();
    var nameEl = $("#bkName"), emailEl = $("#bkEmail"), phoneEl = $("#bkPhone"), notesEl = $("#bkNotes");
    if (nameEl) nameEl.value = "";
    if (emailEl) emailEl.value = "";
    if (phoneEl) phoneEl.value = "";
    if (notesEl) notesEl.value = "";
    $$(".field.is-error", wizard).forEach(function (f) { f.classList.remove("is-error"); });
    goTo(1);
  }

  /* ---------------- Sidebar: upcoming bookings ---------------- */
  function renderSidebar() {
    var list = $("#upcomingList");
    if (!list) return;
    var bookings = getBookings().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    if (!bookings.length) {
      list.innerHTML = '<li style="font-size:13.5px;color:var(--muted)">No upcoming appointments yet.</li>';
      return;
    }
    var now = new Date();
    var future = bookings.filter(function (b) {
      var bd = new Date(b.date + "T" + b.time);
      return bd >= new Date(now.getTime() - 15 * 60000);
    });
    if (!future.length) {
      list.innerHTML = '<li style="font-size:13.5px;color:var(--muted)">No upcoming appointments yet.</li>';
      return;
    }
    list.innerHTML = future.map(function (b) {
      var d = new Date(b.date + "T00:00:00");
      var label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      return (
        "<li style='background:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:14px 14px 12px;display:grid;gap:4px'>" +
        "<strong style='font-size:14px'>" + escapeHtml(b.serviceName) + "</strong>" +
        '<span style="font-size:12.5px;color:var(--muted)">' + label + " at " + minutesToLabel(toMinutes(b.time)) + " &middot; " + escapeHtml(b.barberName) + "</span>" +
        '<span style="font-size:11.5px;color:var(--gold)">' + b.ref + "</span>" +
        '<button class="link-arrow" type="button" style="font-size:12px;border:0;background:none;padding:2px 0 0" data-action="cancel" data-ref="' + b.ref + '">Cancel booking</button>' +
        "</li>"
      );
    }).join("");
    $$('button[data-action="cancel"]', list).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.confirm("Cancel booking " + btn.getAttribute("data-ref") + "? This cannot be undone.")) {
          deleteBooking(btn.getAttribute("data-ref"));
          renderSidebar();
        }
      });
    });
  }

  function onCancel(ref) {
    if (window.confirm("Cancel booking " + ref + "? This cannot be undone.")) {
      deleteBooking(ref);
      renderSidebar();
    }
  }
})();