# BigQuery Release Notes Web Application

A modern, premium web application built with Python Flask and plain vanilla HTML, JavaScript, and CSS. It fetches the official Google Cloud BigQuery release notes feed, parses individual updates by category, and allows you to easily share any specific release note on Twitter/X with a customized draft and live preview.

## Features

- **Automatic Live Feed Sync**: Fetches the official Atom feed directly from Google Cloud.
- **Granular Update Splitting**: Splits multi-topic daily entries (e.g., separating Features, Issues, and Announcements published on the same day) into clean, individual, categorized cards.
- **Premium Glassmorphism Dark Mode UI**: A responsive, visually stunning design featuring:
  - Custom glowing background accents.
  - Floating header and glassmorphic card layouts.
  - Custom scrollbars.
  - Category-based filter badges with matching color gradients.
  - Skeleton loading placeholders.
- **Advanced Filtering & Search**: Real-time client-side search and category filtering to quickly find specific updates (e.g., searching for "Gemini", "vector index", or filtering only "Breaking" changes).
- **Draft & Tweet on X (Twitter)**:
  - Select any release card to highlight it.
  - Click "Tweet" to open a customizable drafting modal (`<dialog>` with native backdrop blur and light-dismiss behavior).
  - Includes a live Twitter-compliant character counter (warns at 260, locks at 280+).
  - Option to include/exclude the source link.
  - Live character-accurate preview highlighting hashtags and URLs.
- **Copy & Share Utilities**: Quick action button to copy the pre-formatted release update (along with date and source link) to the clipboard.
- **Toast Notification System**: Modern floating toast messages for success, info, and error status updates.

## Technical Details

- **Backend**: Python Flask & `requests` (parses Atom XML using `xml.etree.ElementTree` and splits updates via optimized regular expressions).
- **Frontend**:
  - Semantic HTML5.
  - Vanilla CSS (custom properties, variables, CSS transitions, keyframes, backdrop blurs, flex layouts).
  - Vanilla JavaScript (custom event listeners, state management, Twitter Web Intent integration, clipboard API).
  - Standard `<dialog>` with standard backdrop styles and coordinate-based click dismiss fallbacks.
  - Lucide Icons for vector symbols.

## How to Run

1. Make sure Flask and requests are installed:
   ```bash
   python3 -m pip install flask requests
   ```

2. Run the application:
   ```bash
   python3 app.py
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:5001
   ```

## Folder Structure

```
bq-releases-notes/
├── app.py                  # Flask server, XML fetching, and regex parsing
├── templates/
│   └── index.html          # Web page structure, dialog markup, CDN imports
├── static/
│   ├── css/
│   │   └── style.css       # Premium styles, animations, theme, and responsiveness
│   └── js/
│       └── app.js          # App state management, filtering, and tweet intents
└── README.md               # Documentation
```
