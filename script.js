(function () {
  "use strict";

  /* ============ apply background images from data-bg ============ */
  document.querySelectorAll("[data-bg]").forEach(function (el) {
    el.style.backgroundImage = "url('" + el.getAttribute("data-bg") + "')";
  });

  /* ============ loader ============ */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    setTimeout(function () {
      loader.classList.add("hide");
    }, 350);
  });

  /* ============ top nav: scrolled state + mobile toggle ============ */
  var topnav = document.getElementById("topnav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function onScroll() {
    if (window.scrollY > 40) {
      topnav.classList.add("scrolled");
    } else {
      topnav.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", function () {
    var isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ============ print button ============ */
  var printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  /* ============ scroll reveal ============ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ life rail: active dot + progress fill ============ */
  var railItems = Array.prototype.slice.call(document.querySelectorAll(".life-rail li"));
  var railFill = document.getElementById("railFill");
  var railTargets = railItems.map(function (li) {
    return document.getElementById(li.getAttribute("data-target"));
  });

  railItems.forEach(function (li) {
    li.addEventListener("click", function () {
      var target = document.getElementById(li.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function updateRail() {
    var scrollPos = window.scrollY + window.innerHeight * 0.4;
    var activeIdx = 0;
    for (var i = 0; i < railTargets.length; i++) {
      var t = railTargets[i];
      if (t && t.offsetTop <= scrollPos) activeIdx = i;
    }
    railItems.forEach(function (li, i) {
      li.classList.toggle("active", i === activeIdx);
    });

    // progress fill: percentage of page scrolled
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0;
    if (railFill) railFill.style.height = pct + "%";
  }
  window.addEventListener("scroll", updateRail, { passive: true });
  window.addEventListener("resize", updateRail);
  updateRail();

  /* ============ chapter progress dots (odyssey sections) sync ============ */
  var chapterSections = document.querySelectorAll(".chapter-section");
  var allDots = document.querySelectorAll(".dot");
  if ("IntersectionObserver" in window && chapterSections.length) {
    var chapterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = Array.prototype.indexOf.call(chapterSections, entry.target) + 1;
            allDots.forEach(function (d) {
              d.classList.toggle("active", d.getAttribute("data-idx") == idx);
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    chapterSections.forEach(function (s) { chapterObserver.observe(s); });
  }

  /* ============ lightbox for gallery photos ============ */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".gframe[data-full]").forEach(function (frame) {
    frame.addEventListener("click", function () {
      var src = frame.getAttribute("data-full");
      var caption = frame.querySelector("figcaption");
      lightboxImg.src = src;
      lightboxImg.alt = caption ? caption.textContent : "";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
  }
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* ============ programme day tabs ============ */
  var dayTabs = document.querySelectorAll(".day-tab");
  var dayPanels = document.querySelectorAll(".day-panel");
  dayTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var day = tab.getAttribute("data-day");
      dayTabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      dayPanels.forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-day") === day);
      });
    });
  });

  /* ============ back to top ============ */
  var backToTop = document.getElementById("backToTop");
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

})();
