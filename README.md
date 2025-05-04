# Worker Flights Dashboard - Angular Home Assignment

Angular application displaying worker lists and associated flight details with auto-refresh functionality, built for a Quest home assignment.

## Features Summary

- View workers list.
- View flights table for selected worker (refreshes every 1 min).
- View details for selected flight.
- Duration formatted as "Xh Ym".

## Prerequisites

- **Node.js (LTS):** Includes npm. Verify with `node -v`. ([nodejs.org](https://nodejs.org/))
- **Angular CLI:** Install globally: `npm install -g @angular/cli`. Verify with `ng version`.

## Quick Start

1.  **Clone:** `git clone <repository_url>`
2.  **Navigate:** `cd <repository_folder_name>`
3.  **Install:** `npm install`
4.  **Run:** `ng serve -o` (App runs at `http://localhost:4200/`)

## Notes

- **CORS Proxy:** implemented Angular's proxy configuration to solve CORS issues when accessing the backend API (http://128.24.65.53:3000) during development. The proxy.conf.json file routes all /api requests through the Angular dev server, removing the /api prefix and modifying request origins to prevent CORS errors. This proxy configuration only works in development mode. In a production environment, either the backend would need CORS headers configured or a server-side proxy would be required.
- **Styling:** Uses **Bootstrap 5** (via CDN link in `index.html`) for layout and component styling. Minimal custom SCSS is included within components primarily for structural rules (`:host`) or minor tweaks.
