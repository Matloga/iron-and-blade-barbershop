/* ============================================================
   IRON & BLADE — shared business data (single source of truth)
   ============================================================ */
(function () {
  "use strict";

  window.IB = window.IB || {};

  IB.brand = {
    name: "Iron & Blade",
    tagline: "Craft Barbershop",
    phone: "+27 11 325 8877",
    phoneHref: "tel:+27113258877",
    email: "hello@ironandblade.co.za",
    whatsapp: "https://wa.me/27113258877",
    address: "Shop U12, 88 Rivonia Road, Rosebank, Johannesburg, 2196",
    addressShort: "Shop U12, 88 Rivonia Road, Rosebank",
    maps: "https://www.google.com/maps/search/?api=1&query=88+Rivonia+Road,+Rosebank,+Johannesburg",
    timezone: "Africa/Johannesburg",
    utcOffset: "+02:00",
    currency: "R"
  };

  /* Opening hours. day: 0 = Sunday … 6 = Saturday.
     open/close in 24h decimals (9.5 = 09:30). */
  IB.hours = [
    { day: 0, label: "Sunday", open: null, close: null },
    { day: 1, label: "Monday", open: 8.5, close: 18 },
    { day: 2, label: "Tuesday", open: 8.5, close: 18 },
    { day: 3, label: "Wednesday", open: 8.5, close: 18 },
    { day: 4, label: "Thursday", open: 8.5, close: 18 },
    { day: 5, label: "Friday", open: 8.5, close: 19 },
    { day: 6, label: "Saturday", open: 8, close: 16 }
  ];

  IB.services = [
    { id: "classics", cat: "hair", name: "Classic Cut", desc: "Scissor-and-comb cut, wash and finish — timeless and sharp.", price: 180, duration: 30 },
    { id: "skin-fade", cat: "hair", name: "Skin Fade", desc: "Bald fade blended from zero with a razor-clean finish.", price: 230, duration: 45, popular: true },
    { id: "taper-fade", cat: "hair", name: "Taper Fade", desc: "Softer, work-ready fade with a tapered neckline.", price: 210, duration: 40 },
    { id: "buzz-cut", cat: "hair", name: "Buzz Cut", desc: "One-guard simplicity, clipped to your chosen length.", price: 130, duration: 20 },
    { id: "line-up", cat: "hair", name: "Line-Up & Shape", desc: "Hairline, temples and neck tidied with a straight razor.", price: 90, duration: 15 },
    { id: "kids-cut", cat: "kids", name: "Kids Cut (under 12)", desc: "Patient, friendly cuts for first-timers and regulars alike.", price: 130, duration: 30, popular: true },
    { id: "kids-buzz", cat: "kids", name: "Kids Buzz (under 12)", desc: "Quick, fuss-free clipper cut with line-up.", price: 100, duration: 20 },
    { id: "beard-trim", cat: "beard", name: "Beard Trim & Shape", desc: "Clipper, comb and scissor detailing balanced to your face.", price: 120, duration: 20, popular: true },
    { id: "beard-sculpt", cat: "beard", name: "Beard Sculpt & Line-Up", desc: "Full shape with razor-sharp cheek and neck lines.", price: 150, duration: 25 },
    { id: "hot-shave", cat: "beard", name: "Hot Towel Shave", desc: "Traditional straight-razor shave with hot towels and balm.", price: 170, duration: 35 },
    { id: "head-shave", cat: "beard", name: "Head Shave", desc: "Smooth, close head shave finished with cooling balm.", price: 170, duration: 35 },
    { id: "full-works", cat: "packages", name: "The Full Works", desc: "Classic cut + beard trim + hot towel finish.", price: 290, duration: 60, popular: true },
    { id: "signature", cat: "packages", name: "The Signature", desc: "Skin fade + beard sculpt + styling product included.", price: 330, duration: 65 },
    { id: "barber-day", cat: "packages", name: "The Barber's Day", desc: "Cut, hot towel shave, beard oil and scalp massage.", price: 420, duration: 90 },
    { id: "eyebrows", cat: "extras", name: "Eyebrow Tidy", desc: "Neat, natural brow shaping.", price: 70, duration: 15 },
    { id: "black-mask", cat: "extras", name: "Blackhead Mask", desc: "Purifying face mask while your cut sets.", price: 90, duration: 15 },
    { id: "grey-blend", cat: "extras", name: "Grey Blending", desc: "Subtle tone-matched colour blend for hair or beard.", price: 150, duration: 30 }
  ];

  IB.categories = [
    { id: "hair", name: "Cuts & Fades" },
    { id: "beard", name: "Beard & Shaves" },
    { id: "packages", name: "Packages" },
    { id: "kids", name: "Kids Cuts" },
    { id: "extras", name: "Add-Ons" }
  ];

  IB.barbers = [
    {
      id: "themba",
      name: "Themba Nkosi",
      role: "Master Barber & Owner",
      specialty: "Skin fades, classic scissor work",
      experience: 18,
      img: "assets/img/barber-1.jpg",
      bio: "Founder of Iron & Blade. Trained in Johannesburg and London, Themba has faded more heads than he can count and still insists on finishing every cut by hand."
    },
    {
      id: "sipho",
      name: "Sipho Mahlangu",
      role: "Senior Barber",
      specialty: "Beard sculpting, hot towel shaves",
      experience: 12,
      img: "assets/img/barber-2.jpg",
      bio: "Our beard specialist. Sipho pairs straight-razor precision with a proper scalp massage and treats every regular like a first-time guest."
    },
    {
      id: "marcus",
      name: "Marcus Daniels",
      role: "Barber",
      specialty: "Textured crops, line-ups",
      experience: 9,
      img: "assets/img/barber-3.jpg",
      bio: "Marcus keeps the shop on top of what is next — textured crops, modern shapes and razor-sharp hairlines that last beyond the chair."
    },
    {
      id: "junior",
      name: "Junior Mabaso",
      role: "Junior Barber",
      specialty: "Kids cuts, buzz cuts",
      experience: 5,
      img: "assets/img/barber-4.jpg",
      bio: "The calmest pair of hands in the room. Junior is brilliant with nervous first-timers, kids and anyone who wants a quick, clean cut."
    }
  ];

  IB.getService = function (id) {
    return IB.services.find(function (s) { return s.id === id; }) || null;
  };
  IB.getBarber = function (id) {
    return IB.barbers.find(function (b) { return b.id === id; }) || null;
  };
  IB.getCategory = function (id) {
    return IB.categories.find(function (c) { return c.id === id; }) || null;
  };
  IB.money = function (n) { return "R" + n; };
})();