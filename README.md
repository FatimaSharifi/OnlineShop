# Javedan Online Shop

A real, working online shop for women's clothing in Quetta — customer storefront
+ a secure admin panel — built as a static website (works on GitHub Pages) with
[Firebase](https://firebase.google.com) as the free backend for the database,
photo storage, and admin login.

This README walks you (or whoever manages the shop) through getting it fully
live, step by step. No coding experience required — just careful copy/pasting.

---

## What you're getting

- **`index.html`** — the public storefront customers visit
- **`admin.html`** — the private admin dashboard (linked quietly in the storefront footer)
- **`css/style.css`** — all styling, fully responsive for phone, tablet, laptop, desktop
- **`js/shop.js`** — storefront logic (browsing, cart, checkout)
- **`js/admin.js`** — admin logic (login, orders, products, categories)
- **`js/firebase-config.js`** — where you paste your Firebase project keys
- **`firestore.rules`** — the real security layer (see below)

### Why Firebase?

GitHub Pages only hosts static files — it cannot run a real server, keep a
password secret, or store uploaded photos. To have **real, working login for
the admin**, **a live database of orders/products both sides can see
instantly**, and **real photo uploads**, you need a backend. Firebase gives
you all three for free (its free "Spark" plan comfortably covers a small
shop), and it plugs directly into a plain HTML/CSS/JS site with no build
tools — which is exactly what's in this folder.

Security here is **real**, not cosmetic: your admin password is checked by
Google's servers (Firebase Authentication), and the rules in
`firestore.rules` is enforced on Google's servers too — a
customer's browser can never bypass them, no matter what they try.

---

## Part 1 — Create your Firebase project (10 minutes)

1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Add project**, name it e.g. `javedan-online-shop`, and finish the wizard
   (you can disable Google Analytics — not needed).
3. Once created, click the **`</>`  (Web)** icon on the project overview page to
   register a web app. Name it anything (e.g. "Javedan Web"). You do **not**
   need Firebase Hosting — you're using GitHub Pages instead.
4. Firebase will show you a code block containing a `firebaseConfig` object
   with values like `apiKey`, `authDomain`, etc. **Copy your real values**
   into `js/firebase-config.js` in this project, replacing the
   `PASTE_YOUR_...` placeholders.

## Part 2 — Turn on Authentication (admin login)

1. In the Firebase console, left sidebar → **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user** → enter the real admin's email and
   a strong password. This is the login the real admin will use on
   `admin.html`. (You can add more than one admin user here later.)
4. There is **no public sign-up page** anywhere on this site — the only way
   to create an admin account is here, in the Firebase console. That's what
   makes it secure: strangers cannot create their own admin account.

## Part 3 — Turn on Firestore (the database)

1. Left sidebar → **Build → Firestore Database → Create database**.
2. Choose **Production mode**, pick a location close to Pakistan (e.g.
   `asia-south1` or `europe-west`), and click Create.
3. Go to the **Rules** tab, delete what's there, and paste in the full
   contents of **`firestore.rules`** from this project.
4. **Important:** inside those rules, replace
   `"REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com"` with the real admin email
   you created in Part 2 (the exact same email, in quotes). Click **Publish**.
   You can list more than one admin email in that array if needed, e.g.:
   ```
   request.auth.token.email in ["owner@example.com", "manager@example.com"]
   ```

## Part 4 — Product photos (no Firebase Storage needed)

This project does **not** use Firebase Storage for photos — Google now requires
a billing-enabled ("Blaze") plan even for the free Storage tier, which isn't
worth the friction for a shop this size. Instead, product photos work by
**pasting a direct image link**:

1. Go to **https://imgur.com/upload** (no account needed) and upload the photo.
2. Right-click the uploaded image → **Copy image address**.
3. Paste that link into the **Product photo** field when adding an item in
   the admin panel.

Any other free image host works the same way (a public Google Drive/Photos
share link, etc.) as long as the link points directly to the image file.

If you'd rather have a one-click upload button instead of this manual step,
that's possible later by enabling Firebase Storage on the Blaze plan — ask
if you'd like that switched back on.

## Part 5 — Put in your real config

Open `js/firebase-config.js` in this project and make sure every value
matches exactly what Firebase showed you in Part 1, step 4. Save the file.

---

## Part 6 — Put it on GitHub & publish it

1. Create a new repository on GitHub (e.g. `javedan-online-shop`), public or private.
2. Upload **all files and folders exactly as they are** in this project
   (keep the `css/` and `js/` folders — don't flatten them) — either by
   dragging them into GitHub's web uploader, or via `git`:
   ```
   git init
   git add .
   git commit -m "Javedan Online Shop"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/javedan-online-shop.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**,
   branch **main**, folder **/ (root)**. Save.
5. GitHub will give you a live link within a minute or two, typically:
   `https://YOUR_USERNAME.github.io/javedan-online-shop/`

That link is your **public storefront** — share it with customers.
Your **admin panel** is the same link + `admin.html`, e.g.:
`https://YOUR_USERNAME.github.io/javedan-online-shop/admin.html`
— share that one privately with the real admin only. (It's also linked
quietly at the bottom of the storefront, but it always requires the real
login to see anything.)

---

## Part 7 — First-time setup inside the admin panel

1. Open `admin.html`, sign in with the admin email/password from Part 2.
2. The six starting categories (Long Coats, Long Dress with Tops, Long
   Dresses, Skirts, Blazers, Cute Tops) are created automatically the first
   time you log in.
3. Go to the **Items** tab and add your first products — upload a real
   photo, pick a category (or choose **Other** to type a brand-new one —
   it's saved permanently and shows up on the storefront and in future
   dropdowns), set the price, and pick a color from the list, or choose
   **Other** to type any color name not listed.
4. Go to the **Categories** tab any time to see, add, or remove categories.
5. Go to the **Orders** tab to see every order the moment it's placed, with
   the exact date/time, the customer's name/phone/address/house number,
   items ordered, delivery vs. pickup, and total. Use the status dropdown
   on each order (Pending → Confirmed → Shipped → Delivered, or Cancelled)
   to track it after you call the customer to confirm.

---

## How the shop actually behaves

- **Delivery**: Rs. 200 within Quetta city / Hazara Town, automatically
  **free above Rs. 5,000**, or the customer can choose **pickup from the
  shop** at no charge. This logic lives in `js/shop.js`
  (`DELIVERY_CHARGE` and `FREE_DELIVERY_THRESHOLD` — change the numbers
  there if your policy ever changes).
- **Checkout** collects full name, phone number, house address, house
  number, and a payment-confirmation checkbox, and tells the customer
  they'll get a confirmation call before shipping.
- **Cart or single item**: customers can "Add to cart" and check out
  everything together, or "Buy now" a single item immediately.
- **Fully responsive**: tested layout breakpoints for phones, tablets,
  laptops, and desktops (see the `@media` rules at the bottom of
  `css/style.css`).

---

## Ongoing costs

Everything here runs on Firebase's free tier for a shop of this size
(reads/writes/storage limits are generous — tens of thousands of monthly
page loads before you'd ever be charged). GitHub Pages hosting is free.
If the shop grows large, Firebase will simply prompt for billing setup —
there's no surprise cutoff.

## If something needs changing later

- **Change the admin PIN/password**: Firebase console → Authentication →
  Users → reset password, or add a new admin user.
- **Change delivery pricing**: edit `DELIVERY_CHARGE` /
  `FREE_DELIVERY_THRESHOLD` at the top of `js/shop.js`.
- **Change colors/fonts/branding**: edit the `:root` variables at the top of
  `css/style.css`.
- **Add a second admin**: Firebase console → Authentication → add a user,
  then add their email in `firestore.rules` and re-publish.
