/* ============================================================
   MEDIA CONFIG — the tribute video and livestream
   ============================================================

   Fill in the fields below once the family has:
   (a) a tribute/highlight video of Mama's life, and
   (b) a livestream link for the burial events.

   Both accept a YouTube URL, a Vimeo URL, or a direct .mp4 file
   link. Leave a field empty ("") until it's ready — the site
   will show a tasteful "coming soon" state instead of breaking.
   ============================================================ */

window.MEDIA_CONFIG = {

  /* ---------- TRIBUTE VIDEO (top of page) ---------- */
  // Example: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
  // Example: "https://vimeo.com/XXXXXXXXX"
  // Example: "assets/tribute-video.mp4"  (a video file placed in /assets)
  tributeVideoUrl: "",

  // Poster image shown before the video is played
  tributeVideoPoster: "assets/portrait_hero.jpg",
  tributeVideoTitle: "Her Life in Motion",
  tributeVideoCaption: "A short film celebrating 105 years of faith, family and legacy",

  /* ---------- LIVESTREAM (Programme section) ---------- */
  // Example: "https://www.youtube.com/watch?v=XXXXXXXXXXX"  (works for
  //           both a scheduled Premiere and a live broadcast)
  // Example: "https://www.facebook.com/YourPage/videos/XXXXXXXXXXX"
  livestreamUrl: "",

  // Shown on the "watch live" button before the embed is configured
  livestreamPlatformLabel: "YouTube",

  // When the livestream coverage window opens and closes.
  // Used to automatically show "Upcoming" / "LIVE NOW" / "Replay"
  // Format: "YYYY-MM-DDTHH:MM:SS" in the event's local time (WAT, UTC+1)
  livestreamStart: "2026-11-06T06:00:00+01:00",
  livestreamEnd: "2026-11-08T15:00:00+01:00",
};
