# PWA Setup Documentation

This document describes the Progressive Web App (PWA) implementation for the EMERGE Intervention Planner.

## Overview

The EMERGE Intervention Planner now supports offline functionality through PWA features including:
- Service worker for offline caching
- Install prompt for "Add to Home Screen"
- Offline status indicator
- Manifest file for app metadata

## Files Created

### Public Directory

1. **`/public/manifest.json`** - PWA manifest with app metadata
   - Defines app name, colors, icons, and display mode
   - Theme color: `#FF006E`
   - Background color: `#FFFDF5`

2. **`/public/sw.js`** - Service worker for offline functionality
   - Cache-first strategy for static assets (JS, CSS, images, fonts)
   - Network-first strategy for pages and API calls
   - Automatic cache management and cleanup
   - Offline fallback to `/offline` page

3. **`/public/icons/`** - Icon directory
   - `placeholder.svg` - Temporary SVG icon for development
   - `README.md` - Instructions for creating final icons

### Components

4. **`/src/components/pwa/pwa-provider.tsx`** - Main PWA provider
   - Registers service worker on mount
   - Renders offline indicator and install prompt

5. **`/src/components/pwa/install-prompt.tsx`** - Install prompt UI
   - Detects if app can be installed
   - Shows "Add to Home Screen" button
   - Handles `beforeinstallprompt` event

6. **`/src/components/pwa/offline-indicator.tsx`** - Offline status banner
   - Shows banner when offline
   - Auto-hides when connection restored
   - Non-intrusive UI at top of screen

7. **`/src/components/pwa/index.ts`** - Component exports

### Library

8. **`/src/lib/pwa/register-sw.ts`** - Service worker registration utility
   - Registers service worker on page load
   - Handles updates and version changes
   - Provides helper functions for SW management

### Pages

9. **`/src/app/offline/page.tsx`** - Offline fallback page
   - Shown when user is offline and tries to access uncached page
   - Lists available offline features

### Layout

10. **`/src/app/layout.tsx`** - Updated with PWA metadata
    - Manifest link
    - Theme color meta tag
    - Apple web app meta tags
    - Icon links
    - PWAProvider wrapper

## Caching Strategy

### Static Assets (Cache-First)
- JavaScript bundles (`.js`)
- CSS files (`.css`)
- Images (`.png`, `.jpg`, `.svg`, `.webp`, etc.)
- Fonts (`.woff`, `.woff2`, `.ttf`, etc.)
- Next.js static files (`/_next/static/`)

### Dynamic Content (Network-First)
- HTML pages
- API calls
- User-generated content

### Fallback
- When offline and page not cached: redirect to `/offline` page
- Failed requests: return offline message

## Icon Requirements

The app requires the following icon files (currently using placeholders):

- `icon-192.png` - 192x192px PNG (Android)
- `icon-512.png` - 512x512px PNG (Android)
- `apple-touch-icon.png` - 180x180px PNG (iOS) - optional but recommended

**To create icons:**
1. Design a 512x512px icon using brand colors
2. Export at required sizes
3. Replace placeholder references in manifest.json

## Testing PWA Features

### Test Installation
1. Build and serve the app: `npm run build && npm start`
2. Open in Chrome/Edge
3. Look for install prompt or use Chrome menu > "Install EMERGE"

### Test Offline Mode
1. Install the app or open in browser
2. Open DevTools > Network tab
3. Check "Offline" checkbox
4. Navigate to different pages
5. Verify cached pages load correctly
6. Verify offline indicator appears

### Test Service Worker
1. Open DevTools > Application tab
2. Check "Service Workers" section
3. Verify service worker is active
4. Check "Cache Storage" to see cached files

## Browser Support

- **Chrome/Edge**: Full support (install prompt, offline, etc.)
- **Safari (iOS)**: Partial support (no install prompt, but can "Add to Home Screen")
- **Firefox**: Service worker support, limited install prompt

## Features

### Offline Capability
- Access previously loaded data without internet
- View cached intervention plans
- Access student information
- Review reports and charts

### Install as App
- Add to home screen on mobile
- Desktop app experience
- Standalone window (no browser UI)
- Fast access from home screen

### Automatic Updates
- Service worker checks for updates
- Prompts user to reload when new version available
- Seamless update process

## Configuration

### Updating App Colors
Edit `/public/manifest.json`:
```json
{
  "background_color": "#FFFDF5",
  "theme_color": "#FF006E"
}
```

### Updating Cached URLs
Edit `/public/sw.js` `STATIC_ASSETS` array:
```javascript
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // Add more URLs to precache
];
```

### Updating Cache Version
Edit `/public/sw.js`:
```javascript
const CACHE_NAME = 'emerge-v1'; // Increment version number
```

## Deployment Notes

1. **HTTPS Required**: PWA features require HTTPS (or localhost)
2. **Service Worker Scope**: Service worker is registered at root (`/`)
3. **Cache Management**: Old caches are automatically cleaned up
4. **Icons**: Replace placeholder icons before production deployment

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify HTTPS is enabled
- Clear browser cache and reload

### Install Prompt Not Showing
- Chrome requires certain criteria (HTTPS, manifest, service worker, visit time)
- iOS uses native "Add to Home Screen" instead

### Offline Page Not Showing
- Verify service worker is active
- Check that `/offline` route is cached
- Clear cache and re-register service worker

## Future Enhancements

- Background sync for saving data while offline
- Push notifications for updates
- Advanced caching strategies for different content types
- Periodic background sync for data updates
- Cache size management and cleanup policies
