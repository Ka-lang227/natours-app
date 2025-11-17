# Natours (starter)

Small learning project: Natours — an Express + MongoDB app with Pug views and a small frontend bundle built with Parcel.

## Features
- Server-side rendered pages with Pug (views in `views/`)
- REST API for tours, users and reviews (`/api/v1/*`)
- Authentication (cookies / JWT)
- Map integration via Mapbox
- Frontend JS bundled with Parcel (`public/js/bundle.js`)

## Prerequisites
- Node.js >= 14
- npm
- MongoDB (local or remote)
- Mapbox access token (for map views)

## Quick setup (Windows)
1. Install dependencies
   npm install

2. Create a config file (copy/adapt)
   - Create `config.env` (or `.env`) in project root with at least:
     NODE_ENV=development
     PORT=4000
     DATABASE=<your_mongodb_connection_string>
     JWT_SECRET=<secret>
     MAPBOX_TOKEN=<your_mapbox_token>
   - This project ignores `.env` / `config.env` in git.

3. Start the backend server
   npm run start

4. Build/watch frontend JS (Parcel)
   - Development watch (rebuild on change):
     npm run watch:js
   - Production build:
     npm run build:js

Notes:
- Parcel outputs `public/js/bundle.js` (configured via `parcel-namer-rewrite`).
- The server serves static files from `public/` so `bundle.js` is referenced in templates.

## Useful npm scripts
- npm run start — start server with nodemon (server.js)
- npm run start:prod — production start
- npm run watch:js — parcel watch for frontend JS (dev)
- npm run build:js — build frontend JS for production

## Project layout (important files/directories)
- app.js — Express app configuration, middleware, routes
- server.js — app bootstrap (start server)
- controllers/ — route handlers (viewController, authController, userController...)
- Routes/ — express routers (viewRoutes, userRoutes, tourRoutes, reviewRoutes)
- views/ — Pug templates (base.pug, login.pug, tour.pug, account.pug, ...)
- public/ — static assets (css, img, js). Parcel places bundle at `public/js/bundle.js`
- public/js/ — source frontend JS (login.js, mapbox.js, updateSettings.js, index.js)
- models/ — Mongoose models
- utils/ — helpers, error handling

## Content Security Policy (CSP) Configuration

This application uses Mapbox for mapping functionality. If you're using `helmet` with CSP enabled, you need to configure the following directives:

### Required CSP Directives for Mapbox:
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'", 
      "https://*.tiles.mapbox.com", 
      "https://api.mapbox.com", 
      "https://events.mapbox.com"
    ],
    scriptSrc: ["'self'", "https://api.mapbox.com"],
    styleSrc: ["'self'", "https://api.mapbox.com", "'unsafe-inline'"],
    workerSrc: ["'self'", "blob:"],
    childSrc: ["'self'", "blob:"],
    imgSrc: ["'self'", "data:", "blob:"]
  }
}));
```

### Key Points:
- **`connectSrc`**: Allows Mapbox to fetch tiles, API data, and send telemetry
- **`scriptSrc`** & **`styleSrc`**: Required if loading Mapbox GL JS from their CDN
- **`workerSrc`** & **`childSrc`**: Required for Mapbox web workers (with `blob:`)
- **`imgSrc`**: Allows Mapbox to load image tiles using `data:` and `blob:` URIs

### Strict CSP Environments:
If your environment doesn't allow `worker-src blob:` or `child-src blob:`, use the CSP-specific Mapbox bundle:
```html
<script src='https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl-csp.js'></script>
<script>
  mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.x.x/mapbox-gl-csp-worker.js";
</script>
```

For more information, see [Mapbox CSP Documentation](https://docs.mapbox.com/mapbox-gl-js/guides/browsers-and-testing/#csp-directives).

## Common troubleshooting
- "MIME type" or "script blocked": ensure Parcel built `bundle.js` and `public/` serves it. Run `npm run watch:js` or `npm run build:js`.
- "Cannot read properties of null" in client JS: wrap DOM selection logic with checks (e.g. `if (loginForm) { ... }`).
- 404 on API calls: verify server is running and `app.use('/api/v1/...')` routes are mounted.

## Contributing
This is a learning/starter repo. Open issues or submit PRs for fixes/improvements.

## License
MIT
