# Making the Tribute Wall Shared (Live for All Visitors)

> **Looking for the tribute video / livestream setup instead?**
> Scroll down to [Adding the Tribute Video & Livestream](#adding-the-tribute-video--livestream) —
> it's a two-minute edit, no Firebase needed.

Right now, the site works out of the box — but tributes, likes and comments
are only saved in **each visitor's own browser** (a "preview mode" using
local storage). Nobody else will see them.

To make it truly shared — like ForeverMissed, where everyone who visits
sees the same wall of tributes — you need a small free database. The
easiest option is **Google Firebase** (Firestore), which has a generous
free tier that's more than enough for a memorial site. No coding needed,
just copy-and-paste.

This takes about 10 minutes.

---

## Step 1 — Create a free Firebase project

1. Go to **https://console.firebase.google.com** and sign in with any
   Google account.
2. Click **"Add project"**, name it something like `mama-nwa-afo-memorial`,
   and finish the setup wizard (you can turn off Google Analytics).

## Step 2 — Create a Firestore database

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **"Create database"**.
3. Choose **"Start in production mode"**, pick a location close to Nigeria
   (e.g. `eur3` or any available region), and click **Enable**.

## Step 3 — Set security rules

Still in Firestore, click the **Rules** tab and replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tributes/{tributeId} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.message is string
                    && request.resource.data.name.size() < 60
                    && request.resource.data.message.size() < 800;
      allow update: if request.resource.data.diff(resource.data)
                      .affectedKeys().hasOnly(['likes', 'comments']);
      allow delete: if false;
    }
  }
}
```

Click **Publish**. This allows anyone to post a tribute or like/comment,
but not to edit someone else's message or delete tributes — good enough
for a family memorial site without requiring visitors to sign in.

## Step 4 — Register a web app

1. Click the gear icon (⚙) next to "Project Overview" → **Project settings**.
2. Scroll to **"Your apps"** and click the **`</>`** (web) icon.
3. Give it a nickname (e.g. "Memorial Website") and click **Register app**.
4. Firebase will show you a code block that looks like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mama-nwa-afo-memorial.firebaseapp.com",
  projectId: "mama-nwa-afo-memorial",
  storageBucket: "mama-nwa-afo-memorial.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

## Step 5 — Paste it into the website

1. Open **`firebase-config.js`** in the website folder.
2. Replace the `null` at the bottom with your config, like this:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "mama-nwa-afo-memorial.firebaseapp.com",
  projectId: "mama-nwa-afo-memorial",
  storageBucket: "mama-nwa-afo-memorial.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

3. Save the file and re-upload it to wherever the site is hosted.

That's it — reload the page and the yellow "Preview mode" banner will
disappear. Every tribute, like and comment is now shared live with every
visitor, on every device, anywhere in the world.

---

## Optional: moderate tributes before they go public

By default, tributes appear **instantly** (as requested — like
ForeverMissed). If the family would rather review tributes before they're
public (to avoid spam or inappropriate posts), the simplest option is to
check the Firestore **tributes** collection in the Firebase console every
so often and delete anything unwanted — Firebase console lets you delete
individual documents in a couple of clicks, no coding needed.

If you'd like a proper "pending approval" queue instead (tributes only go
live after a family member clicks approve), that's a small additional
build — just ask.

---

## Where to host the website

Any static web host works. Two easy, free options:

- **Netlify** (netlify.com) — drag and drop the whole website folder onto
  their dashboard, get a live link in seconds.
- **GitHub Pages** — free if you already use GitHub.

Once it's hosted, update the link shared in the "Share & Invite" panel by
simply sharing that live URL with family and friends.

---

## Troubleshooting

- **Banner still shows after adding config** — double check there are no
  extra/missing commas in `firebase-config.js`, and that you copied the
  *entire* config object.
- **Tributes not appearing for other people** — confirm you published the
  Firestore rules in Step 3, and that the project ID in your config
  matches the Firebase project you created.
- **Want to reset the demo data** — in preview mode, open your browser's
  developer console on the site and run `localStorage.clear()`, then
  reload.

---

## Adding the Tribute Video & Livestream

These two features live in **`media-config.js`** and need no coding —
just paste in a link once it's ready.

### The tribute video (top of the page)

1. Upload your finished "Her Life in Motion" film to YouTube (unlisted is
   fine, it doesn't need to be public-searchable) or Vimeo.
2. Copy the video's URL — e.g. `https://www.youtube.com/watch?v=XXXXXXXXXXX`.
3. Open `media-config.js` and paste it in:
   ```js
   tributeVideoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
   ```
4. Save and reload the page. The "coming soon" placeholder is replaced by
   a play button over the poster photo; clicking it opens the film in a
   full player.
   - You can also point `tributeVideoUrl` straight at an `.mp4` file if
     you'd rather self-host it (e.g. `assets/tribute-video.mp4`).
   - Change `tributeVideoPoster` to swap which photo is used as the
     preview image before playing.

### The livestream (Programme section)

1. Set up a live broadcast on YouTube Live or Facebook Live for the
   event (most churches/event crews already have a preferred platform —
   either works).
2. Once YouTube/Facebook gives you the stream's URL, paste it in:
   ```js
   livestreamUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
   ```
   A **YouTube "Premiere" or scheduled Live** URL can be added *before*
   the event even starts — YouTube automatically shows its own "starting
   soon" screen until you go live, so there's no harm in adding the link
   early.
3. Adjust `livestreamStart` and `livestreamEnd` if the coverage window
   changes — these control whether the page shows **Upcoming** (with a
   live countdown), **LIVE NOW** (with a pulsing red badge), or
   **Replay Available** automatically, with no further edits needed.

If you'd rather not use YouTube/Facebook at all, any other platform that
gives you an embeddable link will generally work too — paste it into
`livestreamUrl` the same way.
