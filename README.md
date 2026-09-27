# MIAN BITES — Website

A complete, mobile-first website for MIAN BITES (Cafe & Fast Food), Ferozewattwan.
Plain HTML/CSS/JS — no build tools, no frameworks. Every file can be opened and edited directly.

## Folder structure

```
MIAN-BITES/
├── index.html        Home page
├── menu.html          Full menu, search, add-to-cart
├── deals.html         Special deals + birthday party deal
├── order.html         Cart, checkout form, WhatsApp ordering
├── about.html          About MIAN BITES
├── contact.html       Address, phone, hours, map link
├── style.css          All styling (one shared stylesheet)
├── script.js          Cart logic, WhatsApp message builder, nav/search
├── manifest.json      Basic PWA manifest (installable icon/name)
├── sitemap.xml        For search engines
├── robots.txt         For search engines
├── README.md          This file
├── logo.jpg
└── hero-pizza.jpeg
```

## 1. How to run the website

No installation needed.

- **Locally:** double-click `index.html` (or right-click → Open with → your browser). Every link and script uses relative paths, so it works straight from the folder.
- **Important — add your images:** the two images you listed (`logo.jpg`, `hero-pizza.jpeg`) were **not included in your message to me**, so this build only references them by filename. Place your actual files at:
  - `images/logo.jpg`
  - `images/hero-pizza.jpeg`

  Once those two files are in the `images` folder, every page will show them correctly (logo in the header/footer, hero-pizza on the homepage and about page).

## 2. Where to change menu items

Menu items live directly inside **`menu.html`**, grouped by category (Burgers, Regular Pizza, Special Pizza, Pratha Rolls, Wraps, Pasta, Spin Roll, Wings & Nuggets, Fries, Drinks). Each item is one `<div class="item-card">` block. To add a new item, copy an existing card in the same category and edit the name, description and price. Deals live the same way inside **`deals.html`**.

## 3. Where to change prices

- **Simple items** (one price): edit the number in `data-price="349"` **and** the visible text next to it, e.g. `Rs. 349`. Both must match — `data-price` is what the cart actually charges.
- **Pizza (flavour + size)**: edit the `value="900"` and the visible label inside each `<option>` in the size dropdown in `menu.html`.
- **Half/Full or piece-count items** (pasta, wings, spin roll): same idea — edit the `value` and label text inside each `<option>`.
- **Deals**: each deal card in `deals.html` has one `data-price` — edit that number and its visible `Rs.` text.

## 4. Where to change the WhatsApp number

Open **`script.js`** and edit the top of the file:

```js
const CONFIG = {
  WHATSAPP_NUMBER: "923008118120", // country code 92 + number, no leading 0
  ...
};
```

Also update the phone number shown on the page (search for `0300-8118120` and `+923008118120` across the HTML files — it appears in the header, footer, and contact page as a `tel:` and `wa.me` link).

## 5. Where to replace images

Just replace the files inside the `images/` folder, keeping the exact same filenames:

- `images/logo.jpeg` — used in the header and footer on every page
- `images/hero-pizza.jpeg` — used as the homepage hero image and on the About page

No HTML changes needed if you keep the same filenames and folder location.

## 6. How the cart & WhatsApp ordering work

- Cart data is stored in the browser (`localStorage`), so it stays even if the customer closes the tab, and clears if they clear browsing data.
- Adding an item from `menu.html` or `deals.html` adds it to the cart; the header cart icon shows the item count, and a slide-out cart panel (and mobile bottom bar) shows a live subtotal.
- On `order.html`, the customer reviews items (with quantity +/- and remove), fills in name, phone, order type (Delivery / Takeaway / Dine-in) and address (address only required for Delivery), then presses **"Review & Send Order on WhatsApp"**.
- This builds a complete, formatted order message (items, quantities, prices, subtotal, delivery charge if any, grand total, customer details) and opens WhatsApp with that message pre-filled to `03008118120`. The customer still has to press send inside WhatsApp — nothing is sent automatically from the website.
- **Delivery charge below Rs.1000:** the brief specified free delivery above Rs.1000 but did not give a fixed charge below that amount, so the site currently shows "confirmed on call" for those orders and adds Rs.0 to the total. If you want an automatic fee, set `DELIVERY_FEE` in `script.js` to a number, e.g. `DELIVERY_FEE: 99`.

## 7. Menu search

The search box on `menu.html` filters items live by name as the customer types (matches item names only, not descriptions).

## 8. Customer reviews

No fake reviews are included, per your instructions. The reviews sections on the homepage and contact page show a "Customer Reviews Coming Soon" message. When you have real reviews, replace that block (`<div class="reviews-empty">...</div>`) with actual review cards.

## 9. How to publish on GitHub Pages

1. Create a new GitHub repository (e.g. `mian-bites-website`).
2. Upload all files and the `images/` folder, keeping the same structure — either via the GitHub web upload or:
   ```
   git init
   git add .
   git commit -m "MIAN BITES website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mian-bites-website.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, then **Save**.
5. GitHub will publish the site at `https://YOUR-USERNAME.github.io/mian-bites-website/` within a minute or two.
6. Because every link in this site is a relative path (`menu.html`, `images/logo.jpeg`, etc.), it will work correctly on GitHub Pages with no changes.

## Notes

- Built mobile-first with a dark / red / gold theme, no decorative emojis, no stock images — only your logo and hero-pizza image are used.
- `sitemap.xml` and `robots.txt` are included for basic SEO; update the domain inside `sitemap.xml` once you know your final website address.
- `manifest.json` lets phones offer "Add to Home Screen" with your name and colors; it references `images/logo.jpeg` as the icon.
