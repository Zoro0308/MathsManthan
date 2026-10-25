# Maths Manthan | Tuition Classes Website
Domain: `mathsmanthan.co.in` | Location: Kankerkhera, Meerut

Official responsive, modular website for **Maths Manthan**, premier coaching for CBSE Classes 8 to 12 in Mathematics & Science by Manthan Ahlawat.

---

## 📁 Multi-File Architecture

```text
mathsmanthan/
├── index.html                  # Main Landing Page (Hero, Batches, The Manthan Edge, Form, Map)
├── class-10.html               # Class 10 CBSE Board Practice Papers & Formula Sheet Hub
├── class-12.html               # Class 12 Core Mathematics & Calculus Question Hub
│
├── assets/
│   ├── css/
│   │   ├── variables.css       # 60-30-10 Design tokens, colors, typography scales, shadows
│   │   ├── main.css            # Base styles, navbar, hero, cards, WhatsApp form, footer
│   │   └── resources.css       # Dedicated styles for practice papers, filter bar, tags
│   │
│   ├── js/
│   │   ├── main.js             # Mobile hamburger toggle, scroll events, WhatsApp link generator
│   │   └── resources.js        # Instant live search & category filter logic for papers
│   │
│   ├── images/
│   │   ├── logo.png            # Official Maths Manthan brand logo (Dark Navy + Rising Gold)
│   │   └── favicon.png         # Browser tab icon
│   │
│   ├── videos/                 # Background loop videos (optional placeholder)
│   └── pdfs/                   # Chapter test papers and formula sheets (.pdf)
│
└── README.md                   # Project documentation & deployment instructions
```

---

## 🎨 Design Tokens & Branding (60-30-10 Academic Palette)
- **Dominant 60%:** Crisp Paper White (`#FFFFFF`) & Soft Warm Cream (`#FDFBF7`)
- **Secondary 30%:** Oxford Academic Navy (`#0A1D37`)
- **Accent 10%:** Manthan Rising Gold (`#D89617`)
- **Typography:**
  - Headings: `Cinzel` / `Playfair Display`
  - Body & UI: `Plus Jakarta Sans`
  - Handwritten Accents: `Caveat`

---

## 🚀 Local Development & Preview

Because this is a zero-dependency static site (Vanilla HTML5 / CSS3 / ES6 JavaScript), you can test it directly with any local web server:

### Option 1: Python
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

### Option 2: Node.js (npx)
```bash
npx serve .
```

---

## 🌐 Netlify / Custom Domain Deployment Guide

To deploy this site to your domain (`mathsmanthan.co.in`):

1. **GitHub Repository:**
   - Push this directory to a GitHub repository (e.g. `github.com/your-username/MathsManthan`).
2. **Connect to Netlify or Vercel:**
   - Go to [Netlify.com](https://www.netlify.com/) -> **Add new site** -> **Import an existing project**.
   - Select your GitHub repo.
   - Build command: *(leave empty)*
   - Publish directory: `.` or root folder.
3. **Attach Custom Domain (`mathsmanthan.co.in`):**
   - In Netlify **Domain Management**, click **Add custom domain**.
   - Enter `mathsmanthan.co.in`.
   - Update your domain DNS settings (where you purchased the domain, e.g., GoDaddy, Namecheap, Hostinger) with Netlify's DNS records (or CNAME/A records).
4. **Automatic SSL:**
   - Netlify will automatically provision a free Let's Encrypt SSL certificate within a few minutes.

---

## 📞 Contact Information
- **Mentor:** Manthan Ahlawat (M.Sc. Mathematics, B.Ed., CTET Qualified)
- **Center:** D121 European Estate, Kankerkhera, Meerut, UP - 250001
- **Direct Phone / WhatsApp:** +91 8171546558
