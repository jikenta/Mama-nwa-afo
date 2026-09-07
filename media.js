/* ============================================================
   MEDIA — tribute video (top) + livestream (Programme section)
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.MEDIA_CONFIG || {};

  /* ---------- URL → embeddable HTML ---------- */
  function embedHtmlFor(url, opts) {
    opts = opts || {};
    var autoplay = opts.autoplay !== false;
    if (!url) return "";

    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([\w-]{6,})/);
    if (yt) {
      var ytId = yt[1];
      return '<div class="embed-16x9"><iframe src="https://www.youtube.com/embed/' + ytId +
        '?rel=0&autoplay=' + (autoplay ? 1 : 0) +
        '" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    }

    var vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) {
      return '<div class="embed-16x9"><iframe src="https://player.vimeo.com/video/' + vimeo[1] +
        '?autoplay=' + (autoplay ? 1 : 0) +
        '" title="Video" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    }

    if (/facebook\.com/.test(url)) {
      return '<div class="embed-16x9"><iframe src="https://www.facebook.com/plugins/video.php?href=' +
        encodeURIComponent(url) + '&show_text=false&autoplay=' + (autoplay ? 'true' : 'false') +
        '" title="Video" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
      return '<video class="embed-video" controls' + (autoplay ? ' autoplay' : '') + ' playsinline src="' + url + '"></video>';
    }

    // Fallback: generic iframe (works for many "watch" pages, may be blocked by some hosts)
    return '<div class="embed-16x9"><iframe src="' + url + '" title="Video" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div>';
  }

  /* ---------- TRIBUTE VIDEO (top section) ---------- */
  function initTributeVideo() {
    var titleEl = document.getElementById("videoTitle");
    var captionEl = document.getElementById("videoCaption");
    var posterBtn = document.getElementById("videoPosterBtn");
    var posterImg = document.getElementById("videoPosterImg");
    var comingSoon = document.getElementById("videoComingSoon");
    var modal = document.getElementById("videoModal");
    var modalBody = document.getElementById("videoModalBody");

    if (titleEl && cfg.tributeVideoTitle) titleEl.textContent = cfg.tributeVideoTitle;
    if (captionEl && cfg.tributeVideoCaption) captionEl.textContent = cfg.tributeVideoCaption;
    if (posterImg && cfg.tributeVideoPoster) posterImg.src = cfg.tributeVideoPoster;

    if (!cfg.tributeVideoUrl) {
      if (posterBtn) posterBtn.hidden = true;
      if (comingSoon) comingSoon.hidden = false;
      return;
    }

    if (posterBtn) {
      posterBtn.addEventListener("click", function () {
        modalBody.innerHTML = embedHtmlFor(cfg.tributeVideoUrl, { autoplay: true });
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
      });
    }
    // stop playback when the shared modal-close handling closes this modal
    modal.addEventListener("transitionend", function () {
      if (!modal.classList.contains("open")) modalBody.innerHTML = "";
    });
  }

  /* ---------- LIVESTREAM (Programme section) ---------- */
  var countdownTimer = null;

  function initLivestream() {
    var badge = document.getElementById("lsStatusBadge");
    var headline = document.getElementById("lsHeadline");
    var subtext = document.getElementById("lsSubtext");
    var countdownWrap = document.getElementById("lsCountdown");
    var watchBtn = document.getElementById("watchLiveBtn");
    var placeholder = document.getElementById("livestreamEmbedPlaceholder");
    var embedWrap = document.getElementById("livestreamEmbed");

    if (!badge) return;

    var start = cfg.livestreamStart ? new Date(cfg.livestreamStart) : null;
    var end = cfg.livestreamEnd ? new Date(cfg.livestreamEnd) : null;

    function computeStatus() {
      var now = new Date();
      if (start && now < start) return "upcoming";
      if (end && now > end) return "ended";
      if (start && now >= start && (!end || now <= end)) return "live";
      return "upcoming";
    }

    function fmtDate(d) {
      if (!d) return "";
      try {
        return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) +
          " at " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      } catch (e) { return d.toString(); }
    }

    function renderStatus() {
      var status = computeStatus();
      badge.classList.remove("ls-upcoming", "ls-live", "ls-ended");

      if (status === "live") {
        badge.textContent = "\u25CF LIVE NOW";
        badge.classList.add("ls-live");
        headline.textContent = "We're Live!";
        subtext.textContent = "The service is streaming right now \u2014 tap below to watch along with family and friends everywhere.";
        if (countdownWrap) countdownWrap.hidden = true;
        watchBtn.textContent = "\u25CF Watch Live Now";
        clearInterval(countdownTimer);
      } else if (status === "ended") {
        badge.textContent = "Replay Available";
        badge.classList.add("ls-ended");
        headline.textContent = "Watch the Replay";
        subtext.textContent = "The live coverage has ended \u2014 you can still watch the recorded broadcast below.";
        if (countdownWrap) countdownWrap.hidden = true;
        watchBtn.textContent = "\u25B6 Watch Replay";
        clearInterval(countdownTimer);
      } else {
        badge.textContent = "Upcoming";
        badge.classList.add("ls-upcoming");
        headline.textContent = "Watch the Burial Events Live";
        subtext.textContent = start
          ? "Coverage begins " + fmtDate(start) + " (WAT) \u2014 for family and friends who cannot travel to Ogbor Uvuru."
          : "Coverage streams online for family and friends who cannot travel to Ogbor Uvuru.";
        watchBtn.textContent = "\u25CF Watch Live";
        if (countdownWrap && start) {
          countdownWrap.hidden = false;
          startCountdown(start);
        }
      }
    }

    function startCountdown(target) {
      clearInterval(countdownTimer);
      var dEl = document.getElementById("cdDays"), hEl = document.getElementById("cdHours"),
        mEl = document.getElementById("cdMins"), sEl = document.getElementById("cdSecs");
      function tick() {
        var diff = target - new Date();
        if (diff <= 0) { renderStatus(); return; }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        if (dEl) dEl.textContent = String(d).padStart(2, "0");
        if (hEl) hEl.textContent = String(h).padStart(2, "0");
        if (mEl) mEl.textContent = String(m).padStart(2, "0");
        if (sEl) sEl.textContent = String(s).padStart(2, "0");
      }
      tick();
      countdownTimer = setInterval(tick, 1000);
    }

    renderStatus();

    watchBtn.addEventListener("click", function () {
      if (!cfg.livestreamUrl) {
        showLsMessage("The livestream link will be added by the family closer to the event \u2014 please check back soon.");
        return;
      }
      var isOpen = embedWrap && !embedWrap.hidden;
      if (isOpen) {
        embedWrap.hidden = true;
        embedWrap.innerHTML = "";
        placeholder.hidden = false;
        watchBtn.textContent = watchBtn.textContent.replace("Hide", computeStatus() === "live" ? "Watch Live Now" : "Watch Live");
      } else {
        embedWrap.innerHTML = embedHtmlFor(cfg.livestreamUrl, { autoplay: true });
        embedWrap.hidden = false;
        placeholder.hidden = true;
        embedWrap.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    if (!cfg.livestreamUrl && placeholder) {
      placeholder.querySelector("p").textContent = "Livestream link will be added closer to the event.";
    }
  }

  function showLsMessage(msg) {
    if (typeof window.__memorialToast === "function") { window.__memorialToast(msg); return; }
    var toast = document.getElementById("toast");
    if (!toast) { alert(msg); return; }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTributeVideo();
    initLivestream();
  });
})();
