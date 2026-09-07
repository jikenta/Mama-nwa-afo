/* ============================================================
   TRIBUTE WALL — add tributes instantly, like, comment, share
   Works two ways:
   1) SHARED MODE — if firebase-config.js has real credentials,
      every visitor reads/writes the same live Firestore data.
   2) PREVIEW MODE — if not configured, falls back to this
      browser's localStorage so the page still works for testing.
   ============================================================ */
(function () {
  "use strict";

  var PAGE_SIZE = 6;
  var visibleCount = PAGE_SIZE;
  var currentSort = "newest";
  var allTributes = [];
  var db = null;
  var mode = "local"; // "shared" | "local"

  var LOCAL_KEY = "mamaNwaAfo_tributes_v1";
  var LIKED_KEY = "mamaNwaAfo_liked_v1";

  /* ---------- boot: decide shared vs local ---------- */
  function boot() {
    var cfg = window.FIREBASE_CONFIG;
    var fbReady = typeof firebase !== "undefined" && cfg && cfg.apiKey && !window.__fbLoadFailed;

    if (fbReady) {
      try {
        firebase.initializeApp(cfg);
        db = firebase.firestore();
        mode = "shared";
        listenShared();
        return;
      } catch (e) {
        console.warn("Firebase init failed, falling back to preview mode:", e);
      }
    }
    mode = "local";
    var banner = document.getElementById("demoBanner");
    if (banner) banner.hidden = false;
    loadLocal();
    render();
  }

  /* ---------- SHARED (Firestore) backend ---------- */
  function listenShared() {
    db.collection("tributes").orderBy("createdAt", "desc").limit(200)
      .onSnapshot(function (snap) {
        allTributes = snap.docs.map(function (d) {
          var data = d.data();
          return {
            id: d.id,
            name: data.name || "Anonymous",
            relation: data.relation || "",
            message: data.message || "",
            likes: data.likes || 0,
            comments: data.comments || [],
            createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now(),
          };
        });
        render();
      }, function (err) {
        console.warn("Firestore listen failed, switching to preview mode:", err);
        mode = "local";
        var banner = document.getElementById("demoBanner");
        if (banner) banner.hidden = false;
        loadLocal();
        render();
      });
  }

  function addTributeShared(t) {
    return db.collection("tributes").add({
      name: t.name,
      relation: t.relation,
      message: t.message,
      likes: 0,
      comments: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  function toggleLikeShared(id, alreadyLiked) {
    var delta = alreadyLiked ? -1 : 1;
    return db.collection("tributes").doc(id).update({
      likes: firebase.firestore.FieldValue.increment(delta),
    });
  }

  function addCommentShared(id, comment) {
    return db.collection("tributes").doc(id).update({
      comments: firebase.firestore.FieldValue.arrayUnion(comment),
    });
  }

  /* ---------- LOCAL (localStorage) backend ---------- */
  function loadLocal() {
    var raw = null;
    try { raw = localStorage.getItem(LOCAL_KEY); } catch (e) {}
    if (raw) {
      try { allTributes = JSON.parse(raw); return; } catch (e) {}
    }
    allTributes = seedTributes();
    saveLocal();
  }
  function saveLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(allTributes)); } catch (e) {}
  }
  function seedTributes() {
    var now = Date.now();
    return [
      {
        id: "seed1", name: "Chinwe O.", relation: "Family Friend",
        message: "Mama Nwa-afo's smile could light up the whole compound. Her prayers over the years carried my own family through so much. Resting in peace, Mama.",
        likes: 4, comments: [{ name: "Uche A.", text: "Beautifully said. She will be missed dearly." }],
        createdAt: now - 1000 * 60 * 60 * 5,
      },
      {
        id: "seed2", name: "Emeka N.", relation: "Church Member, Ogbor Uvuru",
        message: "I remember Mama leading prayers with such quiet strength. Ogbor Uvuru has lost a true mother of the faith. Adieu, Mama Nwa-afo.",
        likes: 2, comments: [],
        createdAt: now - 1000 * 60 * 60 * 26,
      },
    ];
  }
  function addTributeLocal(t) {
    var tribute = {
      id: "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: t.name, relation: t.relation, message: t.message,
      likes: 0, comments: [], createdAt: Date.now(),
    };
    allTributes.unshift(tribute);
    saveLocal();
    render();
  }
  function toggleLikeLocal(id) {
    var t = allTributes.find(function (x) { return x.id === id; });
    if (!t) return;
    var liked = getLiked();
    if (liked[id]) { t.likes = Math.max(0, t.likes - 1); delete liked[id]; }
    else { t.likes = (t.likes || 0) + 1; liked[id] = true; }
    setLiked(liked);
    saveLocal();
    render();
  }
  function addCommentLocal(id, comment) {
    var t = allTributes.find(function (x) { return x.id === id; });
    if (!t) return;
    t.comments = t.comments || [];
    t.comments.push(comment);
    saveLocal();
    render();
  }

  /* ---------- liked-state helper (works in both modes, per-browser) ---------- */
  function getLiked() {
    try { return JSON.parse(localStorage.getItem(LIKED_KEY) || "{}"); } catch (e) { return {}; }
  }
  function setLiked(obj) {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  /* ---------- public actions (mode-aware) ---------- */
  function addTribute(t) {
    if (mode === "shared") {
      addTributeShared(t).then(function () {
        showToast("Tribute posted \u2014 thank you for sharing.");
      }).catch(function (e) {
        console.warn(e); showToast("Could not post right now. Please try again.");
      });
    } else {
      addTributeLocal(t);
      showToast("Tribute posted \u2014 thank you for sharing.");
    }
  }
  function toggleLike(id) {
    var liked = getLiked();
    var alreadyLiked = !!liked[id];
    if (mode === "shared") {
      toggleLikeShared(id, alreadyLiked).then(function () {
        if (alreadyLiked) delete liked[id]; else liked[id] = true;
        setLiked(liked);
        render();
      }).catch(function (e) { console.warn(e); });
    } else {
      toggleLikeLocal(id);
    }
  }
  function addComment(id, comment) {
    if (mode === "shared") {
      addCommentShared(id, comment).catch(function (e) { console.warn(e); });
    } else {
      addCommentLocal(id, comment);
    }
  }

  /* ---------- rendering ---------- */
  function timeAgo(ms) {
    var s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
    var units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (var i = 0; i < units.length; i++) {
      var v = Math.floor(s / units[i][1]);
      if (v >= 1) return v + " " + units[i][0] + (v > 1 ? "s" : "") + " ago";
    }
    return "just now";
  }
  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function sortedTributes() {
    var arr = allTributes.slice();
    if (currentSort === "liked") arr.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    else arr.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    return arr;
  }

  var openComments = {}; // track which comment panels are expanded across re-renders

  function render() {
    var wall = document.getElementById("tributeWall");
    var loadMoreBtn = document.getElementById("loadMoreTributes");
    if (!wall) return;
    var liked = getLiked();
    var arr = sortedTributes();
    var toShow = arr.slice(0, visibleCount);

    if (!arr.length) {
      wall.innerHTML = '<p class="wall-empty">Be the first to leave a tribute for Mama Nwa-afo.</p>';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    wall.innerHTML = toShow.map(function (t) {
      var isLiked = !!liked[t.id];
      var commentsHtml = (t.comments || []).map(function (c) {
        return '<div class="tc-comment"><strong>' + escapeHtml(c.name) + ':</strong> ' + escapeHtml(c.text) + '</div>';
      }).join("");
      return (
        '<article class="tc-card" data-id="' + t.id + '">' +
          '<div class="tc-head">' +
            '<div class="tc-avatar">' + escapeHtml((t.name || "?").charAt(0).toUpperCase()) + '</div>' +
            '<div class="tc-who"><strong>' + escapeHtml(t.name) + '</strong>' +
              (t.relation ? '<span class="tc-relation">' + escapeHtml(t.relation) + '</span>' : '') +
            '</div>' +
            '<span class="tc-time">' + timeAgo(t.createdAt) + '</span>' +
          '</div>' +
          '<p class="tc-message">' + escapeHtml(t.message) + '</p>' +
          '<div class="tc-actions">' +
            '<button class="tc-like' + (isLiked ? ' liked' : '') + '" data-like="' + t.id + '">&#10084; <span>' + (t.likes || 0) + '</span></button>' +
            '<button class="tc-comment-toggle" data-toggle-comments="' + t.id + '">&#128172; ' + (t.comments ? t.comments.length : 0) + ' Comment' + ((t.comments && t.comments.length === 1) ? '' : 's') + '</button>' +
          '</div>' +
          '<div class="tc-comments"' + (openComments[t.id] ? '' : ' hidden') + '>' +
            '<div class="tc-comment-list">' + (commentsHtml || '<p class="tc-no-comments">No comments yet.</p>') + '</div>' +
            '<form class="tc-comment-form" data-comment-form="' + t.id + '">' +
              '<input type="text" placeholder="Your name" class="tc-cname" maxlength="40" required>' +
              '<input type="text" placeholder="Write a reply&hellip;" class="tc-ctext" maxlength="300" required>' +
              '<button type="submit">Post</button>' +
            '</form>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    if (loadMoreBtn) loadMoreBtn.hidden = visibleCount >= arr.length;
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }
  window.__memorialToast = showToast;

  /* ---------- modal helpers ---------- */
  function openModal(modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  /* ---------- wire up UI ---------- */
  function wireUI() {
    var tributeModal = document.getElementById("tributeModal");
    var shareModal = document.getElementById("shareModal");
    var videoModal = document.getElementById("videoModal");

    var openTributeBtn = document.getElementById("openTributeForm");
    if (openTributeBtn) openTributeBtn.addEventListener("click", function () { openModal(tributeModal); });

    [document.getElementById("openShareModal"), document.getElementById("floatingShare")].forEach(function (btn) {
      if (btn) btn.addEventListener("click", function () { prepShare(); openModal(shareModal); });
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", function () { closeModal(btn.closest(".modal")); });
    });
    [tributeModal, shareModal, videoModal].forEach(function (m) {
      if (!m) return;
      m.addEventListener("click", function (e) { if (e.target === m) closeModal(m); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { [tributeModal, shareModal, videoModal].forEach(function (m) { if (m && m.classList.contains("open")) closeModal(m); }); }
    });

    var form = document.getElementById("tributeForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = document.getElementById("tfName").value.trim();
        var relation = document.getElementById("tfRelation").value.trim();
        var message = document.getElementById("tfMessage").value.trim();
        if (!name || !message) return;
        addTribute({ name: name, relation: relation, message: message });
        form.reset();
        closeModal(tributeModal);
        visibleCount = Math.max(visibleCount, PAGE_SIZE);
      });
    }

    var sortWrap = document.getElementById("wallSort");
    if (sortWrap) {
      sortWrap.addEventListener("click", function (e) {
        var btn = e.target.closest(".sort-btn");
        if (!btn) return;
        currentSort = btn.getAttribute("data-sort");
        sortWrap.querySelectorAll(".sort-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
        render();
      });
    }

    var loadMoreBtn = document.getElementById("loadMoreTributes");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", function () {
        visibleCount += PAGE_SIZE;
        render();
      });
    }

    var wall = document.getElementById("tributeWall");
    if (wall) {
      wall.addEventListener("click", function (e) {
        var likeBtn = e.target.closest("[data-like]");
        if (likeBtn) { toggleLike(likeBtn.getAttribute("data-like")); return; }
        var toggleBtn = e.target.closest("[data-toggle-comments]");
        if (toggleBtn) {
          var id = toggleBtn.getAttribute("data-toggle-comments");
          var panel = toggleBtn.closest(".tc-card").querySelector(".tc-comments");
          panel.hidden = !panel.hidden;
          openComments[id] = !panel.hidden;
        }
      });
      wall.addEventListener("submit", function (e) {
        var cform = e.target.closest("[data-comment-form]");
        if (!cform) return;
        e.preventDefault();
        var id = cform.getAttribute("data-comment-form");
        var name = cform.querySelector(".tc-cname").value.trim();
        var text = cform.querySelector(".tc-ctext").value.trim();
        if (!name || !text) return;
        openComments[id] = true;
        addComment(id, { name: name, text: text });
        cform.reset();
        if (mode === "local") { /* render() called by addCommentLocal */ }
        else { showToast("Comment added."); }
      });
    }
  }

  /* ---------- share modal content ---------- */
  function prepShare() {
    var url = window.location.href.split("#")[0];
    var linkInput = document.getElementById("shareLinkInput");
    if (linkInput) linkInput.value = url;

    var text = "In loving memory of Mrs. Nneoma Monica Nwafo Akagburuonye (Mama Nwa-afo) \u2014 join us in celebrating her life:";
    var wa = document.getElementById("shareWhatsapp");
    if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
    var fb = document.getElementById("shareFacebook");
    if (fb) fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    var tw = document.getElementById("shareTwitter");
    if (tw) tw.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
    var em = document.getElementById("shareEmail");
    if (em) em.href = "mailto:?subject=" + encodeURIComponent("In Loving Memory of Mama Nwa-afo") + "&body=" + encodeURIComponent(text + "\n\n" + url);

    var copyBtn = document.getElementById("copyLinkBtn");
    if (copyBtn && !copyBtn.__wired) {
      copyBtn.__wired = true;
      copyBtn.addEventListener("click", function () {
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        var done = function () { showToast("Link copied \u2014 share it with family and friends."); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(linkInput.value).then(done).catch(function () {
            document.execCommand("copy"); done();
          });
        } else {
          document.execCommand("copy"); done();
        }
      });
    }
    var inviteBtn = document.getElementById("sendInviteBtn");
    if (inviteBtn && !inviteBtn.__wired) {
      inviteBtn.__wired = true;
      inviteBtn.addEventListener("click", function () {
        var email = document.getElementById("inviteEmailInput").value.trim();
        if (!email) return;
        window.location.href = "mailto:" + encodeURIComponent(email) +
          "?subject=" + encodeURIComponent("In Loving Memory of Mama Nwa-afo") +
          "&body=" + encodeURIComponent(text + "\n\n" + url);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireUI();
    boot();
  });
})();
