# Project: Luxury Affairs Store

## Objective
Build a high-converting luxury eCommerce storefront using a static frontend with WhatsApp-based ordering. Modelled visually after OpaleBags.net layout.

This project is designed as a foundation for a future SaaS product.

---

## Current Phase: MVP (Conversion-Focused Store)

### Core Business Model
- No prices displayed
- No cart or checkout
- No payment gateway
- All orders handled via WhatsApp: https://wa.me/17175385671
- Focus on Instagram/WhatsApp traffic

---

## Tech Stack

- HTML5
- CSS3 (custom, no frameworks)
- Vanilla JavaScript (NO ES modules — plain scripts only)
- Google Fonts: Inter + Playfair Display (loaded via link tag)
- CSV (product database)
- GitHub Pages (deployment)

---

## Project Structure

/project
│
├── index.html
├── handbags.html
├── footwear.html
├── jewelry.html
├── product.html
├── trust.html
├── reviews.html
│
├── css/
│   └── style.css
│
├── js/
│   └── main.js          ← single file, no modules, no import/export
│
├── data/
│   └── products.csv
│
└── images/
    └── logo.png

---

## Design System

### Colors
- Background:   #0d0d0d
- Card:         #141414
- Card hover:   #1c1c1c
- Gold:         #c9a227
- Gold hover:   #e0b840
- White text:   #f0f0f0
- Muted text:   #888888
- Border:       rgba(255,255,255,0.08)
- WA green:     #25d366

### Typography
- UI font:      Inter (Google Fonts)
- Display font: Playfair Display (Google Fonts, headings only)
- Base size:    15px

### Spacing & Shape
- Border radius cards: 10px
- Border radius buttons: 6px
- Section padding: 32px 16px (mobile), 48px 5% (desktop)

---

## Navbar Layout

```
[ ≡ hamburger ]     LUXURY AFFAIRS     [ search ] [ theme ]
```

- Hamburger left — opens full-screen or side drawer with all nav links
- Logo text center — "LUXURY" in white + "AFFAIRS" in gold (#c9a227)
- Search icon opens search overlay
- Theme toggle (sun/moon) right
- Below navbar: full-width scrolling ticker

### Ticker Messages
- "CLICK TO VIEW THE VAULT: PAYMENT & DELIVERY PROOFS (2020–2026)"
- "EST. 2020 | 50,000+ SUCCESSFUL DELIVERIES GLOBALLY"
- "WHATSAPP-DIRECT | 3–4 DAY EXPRESS SHIPPING"
- "100% AUTHENTIC — VERIFIED EVERY ORDER"

---

## Homepage Sections (in order)

### 1. Profile Hero
- Logo circle (80px, gold border, gold glow)
- Store name: "Luxury Affairs Store" (white, 1.4rem)
- Gold tagline: "The World's Finest Private Luxury Collection."
- 2-line description (muted)
- Instagram icon button + WhatsApp icon button (round, dark bg)
- Search bar: full-width rounded input + gold GO button

### 2. About Us Card
- Dark rounded card (#141414, gold border)
- "ABOUT US" header in gold
- Bullet list:
  - Gold term + white parenthetical description
  - Example: "• 50k+ Items (Handbags, Footwear, Jewelry, Watches)"
  - "• WhatsApp-Direct (No showroom fees, direct to you)"
  - "• Secure & Discreet Delivery (Fully insured shipping)"

### 3. Category Brand-Logo Sections (one per category)
- Section title: gold, left-aligned, Playfair italic
- "View All →" link right-aligned
- 3-column grid of brand logo cards
- Each brand card:
  - Dark bg (#141414), rounded (10px), subtle border
  - Brand logo (SVG text or white PNG) centered
  - Brand name text below (white, 0.78rem)
  - Hover: slight brightness lift + gold border
  - Click → collection page filtered by brand (?brand=chanel)
- Categories shown:
  - Luxury Handbags: Chanel, Hermes, Dior, Gucci, Prada, LV, YSL, Celine, Bottega
  - Luxury Footwear: Chanel, Hermes, Gucci, Dior, Prada, Valentino, YSL, Alaia, Loro Piana
  - Fine Jewelry & Watches: Cartier, Chanel, Gucci, Bulgari, Van Cleef, LV, Hermes, Tiffany, Chrome Hearts

### 4. Happy Clients
- Gold title "Happy Clients" left-aligned
- Horizontal auto-scroll strip of customer photo placeholders
- Pause on hover

### 5. Recent Verified Transactions
- Gold title left-aligned
- Horizontal auto-scroll strip of payment invoice card placeholders
- Each card shows: invoice icon, amount, city, time-ago

---

## Collection Pages (handbags.html, footwear.html, jewelry.html)

### Layout
- Ticker below navbar
- Breadcrumb: Home / Category / Brand (if brand filtered)
- Page heading + product count
- Show: X per page | grid toggle buttons (2-col / 4-col)
- Brand filter tabs (All + individual brands)
- Products grid:
  - 2 columns default (mobile: 1 col)
  - Card: full-width image (aspect 3/4), product name below
  - Click card → product.html?params
  - No price, no WA button on card
- Pagination: page numbers + "Go to page" input

---

## Product Page (product.html)

All data passed via URL search params: name, brand, cat, image, images (pipe-separated), wa

### Layout
- Ticker
- Breadcrumb: Home / Category / Brand / Product Name
- Two-column layout (desktop):

LEFT: Image Gallery
  - Main image with prev/next arrow buttons
  - Counter "1 / 9" bottom-left overlay
  - Fullscreen button bottom-right
  - Thumbnails row below (7 visible, scrollable)

RIGHT: Product Info
  - "1:1 MIRROR GRADE" gold badge (top right)
  - Category path: "BAGS • Chanel Bags" (muted, small)
  - Product title (Playfair, large, white)
  - Sale banner card (dark, animated border): "LIMITED OFFER — Message now for best price"
  - "● X people viewing now" (green dot, live counter)
  - "⚠ Low Inventory: Only Y Units Remaining" (amber warning)
  - Trust mini-strip: [VIEW REAL TESTIMONIALS →] [✓ FAST GLOBAL SHIPPING]
  - Big full-width green WA button: "CHECK FACTORY AVAILABILITY"
  - "Response time: < 5 Minutes" below button

Below the fold (full width):
  - "Real Customer Reviews ✓ VERIFIED" + "See All →"
  - 4 video-style thumbnail cards with VIDEO badge
  - "Want to see more proof?" gold banner → trust.html
  - "Why Choose Us" — 3 cards: QC Video Proof | Seizure Protection | No-Fade Warranty
  - "Frequently Asked Questions" accordion (5 items)

---

## Trust Page (trust.html) — "The Verification Archive"

- Page title: "The Verification Archive" (Playfair italic, gold)
- Subtitle: "5+ Years of Unedited Delivery Proofs, Bank Receipts, and Client Unboxings."
- Amber transparency notice bar
- Timeline: horizontal scrollable row of month-year circle thumbnails
  - Clicking selects that month and filters proof grid
  - Active month has gold ring
- Proof image grid: 4 columns, images + captions
  - Invoice screenshots, tracking screenshots, unboxing photos

---

## Reviews Page (reviews.html)

- Title: "Client Video Reviews"
- Filter tabs: All | Handbags | Footwear | Jewelry
- 3-column video card grid
  - Each card: dark bg, play overlay, title, stars, reviewer name/city

---

## Footer (All Pages)

```
[ WA green icon ]  Don't see what you're looking for?
                   Upload a photo on WhatsApp and we will find it.   [ → ]

        LUXURY AFFAIRS
     The World's Finest Private Luxury Collection.
         [ Instagram ]  [ WhatsApp ]
          © 2026 All rights reserved.
```

---

## Floating WhatsApp Button

- Position: fixed bottom-right
- Green circle with WA icon
- Label text above button (changes per page):
  - index.html:      "CONSULT WITH A LUXURY SPECIALIST"
  - handbags/footwear/jewelry.html: "GET PERSONALIZED RECOMMENDATIONS"
  - product.html:    "ASK ABOUT EXCLUSIVE OFFERS"
  - trust.html:      "CHAT WITH OUR EXPERTS NOW"
  - reviews.html:    "ORDER YOUR LUXURY PIECE"

---

## Just Purchased Popup

- Position: fixed bottom-left
- Slides in 3 seconds after page load
- Shows every 5 seconds
- Content: product emoji + "JUST PURCHASED" label + product name + city
- Auto-hides after 3.5 seconds
- 20 product names + 20 USA cities

---

## Data System

### CSV Format (data/products.csv)
```
name,image,category,brand,images,whatsapp_text,badge
```

- images field: pipe-separated URLs
- badge field: "New" | "Hot" | "" (empty)
- All rendering dynamic from CSV — nothing hardcoded in HTML

### Brand Card Data (hardcoded in main.js)
Brand logo cards on homepage and collection brand grids are hardcoded in JS (not from CSV) as they are static brand identity, not products.

---

## JavaScript Architecture (main.js)

Single file, no modules, no import/export. Functions:

- `parseCSV(text)` — parse CSV string to array of objects
- `loadProducts(callback)` — fetch + parse products.csv, call callback
- `renderProductGrid(products, containerId, perPage)` — render paginated grid
- `renderBrandGrid(brands, containerId, linkBase)` — render brand logo cards
- `initProductPage()` — read URL params, populate product page
- `initGallery()` — thumbnail clicks + prev/next + counter
- `initUrgency()` — random viewing count, live counter update
- `initFAQ()` — accordion open/close
- `initPopup()` — just purchased popup rotation
- `initTheme()` — dark/light toggle + localStorage
- `initTicker()` — duplicate ticker content for infinite scroll
- `initSearch()` — search bar on homepage
- `initHamburger()` — mobile drawer open/close
- `initTransactions()` — render + animate transaction slider
- `initHappyClients()` — render + animate client photo slider
- `boot()` — called on DOMContentLoaded, detects page and runs relevant inits

---

## Performance Rules

- No frameworks (React, Vue, jQuery, Bootstrap)
- No ES modules (no import/export)
- Google Fonts loaded via preconnect + stylesheet link
- Lazy load images (loading="lazy")
- CSS animations use transform/opacity only

---

## Restrictions

- No backend
- No database
- No authentication
- No payment integration
- No type="module" script tags

---

## SaaS Roadmap (Future)

This project will evolve into:
- CSV → Auto Store Generator
- Multi-store system
- Admin dashboard
- Subscription-based SaaS

---

## Priority Rules

1. Conversion over design perfection
2. Speed over complexity
3. Simplicity over over-engineering
