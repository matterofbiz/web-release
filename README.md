# web-release

Public website and product microsites for Matter of Biz.

This repository contains a static marketing site showcasing a portfolio of privacy-focused digital products and demos. The main landing page presents EdgeDraft, with supporting product pages for CrochetPulse and spheRate.

## Overview

- EdgeDraft: private AI meeting assistant for recording, transcribing, and summarizing conversations entirely on-device
- CrochetPulse: voice-assisted crochet pattern manager and yarn tracking helper
- spheRate: feedback/rating experience designed with strict local-only behavior

## Repository structure

```text
.
├── index.html              # Main public landing page
├── styles.css              # Shared site styles
├── CNAME                   # Custom domain configuration
├── assets/                 # Images and media assets
├── edgedraft/              # EdgeDraft product pages and privacy policy
├── crochetpulse/           # CrochetPulse microsite
├── spherate/               # spheRate microsite and feedback app
└── README.md               # Project overview
```

## Site highlights

### EdgeDraft

The main homepage promotes a privacy-first meeting assistant that:

- records audio locally
- transcribes conversations offline
- summarizes meeting notes without cloud uploads
- keeps data encrypted and on-device

### CrochetPulse

A product-focused microsite for a hands-free crochet pattern companion with:

- voice commands
- stitch and row tracking
- yarn management tools
- interactive pattern workflows

### spheRate

A lightweight feedback interface built to avoid sending data anywhere by default, keeping responses in the browser until the user chooses to share them externally.

## Local preview

Because this is a static website, you can preview it locally without a build step:

```bash
cd web-release
python3 -m http.server 8000
```

Then open:

- http://localhost:8000/
- http://localhost:8000/crochetpulse/
- http://localhost:8000/spherate/

## Notes

- The project is primarily HTML and CSS.
- The site is designed as a public-facing marketing and product showcase.
- Some subpages are standalone microsites and may include their own embedded assets or scripts.

## License

This project does not currently declare a repository license in the source tree.
