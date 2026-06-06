# Smart Fridge - Expiry Tracker

A client-side Svelte 5 web application to track food inventory and monitor expiration dates.

## Features

- **Expiry Tracking**: Log items, quantities, categories, and custom notes.
- **Visual Status & Stats**: Monitor total, expired, and expiring-soon items.
- **Product Lookup**: Scan barcodes (via camera) or enter them manually to query the Open Food Facts API for product names, brands, categories, and images.
- **Search & Filters**: Search food items by name, brand, or notes, filter by categories, and sort by expiry date, name, or date added.
- **Data Portability**: Export inventory to a JSON file or import a backup file to restore data.
- **Local Storage**: All data is persisted client-side in the browser's `localStorage`.

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```sh
npm install
```

### Run the Dev Server

Run the development server locally:

```sh
npm run dev
```

To access the app from other devices on your local network (e.g., your phone), run it with the host flag:

```sh
npm run dev -- --host
```

## Secure Contexts & Mobile Notes

Standard web security policies restrict camera access APIs (`getUserMedia`) and cryptographic UUID generation (`crypto.randomUUID`) to **secure contexts** (HTTPS or `localhost`). 

When accessing the development server on a mobile phone over a local IP (e.g. `http://192.168.x.x:5173`):
- **Camera Scanning**: The browser will block camera access. The app detects this and presents a manual input fallback where you can type standard barcode numbers (EAN/UPC) directly.
- **ID Generation**: The app falls back to a pseudo-random generator if the secure `crypto.randomUUID` method is unavailable.

Deploying the application over HTTPS (e.g., via GitHub Pages) will automatically restore full camera access on mobile devices.

## Build and Deployment

### Static Hosting Configuration (e.g., GitHub Pages)

To compile the application as a purely static site, SvelteKit can be configured to use `@sveltejs/adapter-static` instead of the default `@sveltejs/adapter-auto`.

1. Install the static adapter:
   ```sh
   npm install -D @sveltejs/adapter-static
   ```

2. Replace the adapter import in `svelte.config.js`:
   ```javascript
   import adapter from '@sveltejs/adapter-static';
   ```

3. Create a layout configuration file at `src/routes/+layout.ts` (or `+layout.js`) to disable server-side rendering and force static builds:
   ```typescript
   export const prerender = true;
   export const ssr = false;
   ```

4. Build the application:
   ```sh
   npm run build
   ```
   The compiled static files will be placed in the `build/` directory, ready to be hosted on GitHub Pages or any static file server.
