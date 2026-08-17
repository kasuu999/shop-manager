# Shop Manager — Frontend (Initial Setup)

## Folder structure

```
src/
  api/
    axiosInstance.js     -> shared Axios instance (baseURL + JWT header)
  layout/
    MainLayout.jsx        -> Sidebar + Header + <Outlet /> shell
    Sidebar.jsx
    Header.jsx
  pages/                   -> one placeholder page per module
  components/
    PagePlaceholder.jsx    -> shared "coming soon" card used by every page
  routes/
    AppRoutes.jsx          -> all <Route> definitions in one place
  App.jsx
  main.jsx
  index.css
```

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend runs elsewhere
npm run dev
```

App runs at http://localhost:5173 by default.

## What's included

- React Router with a shared layout (sidebar + header) wrapping every page except `/login`
- A reusable Axios instance (`src/api/axiosInstance.js`) that automatically attaches a JWT
  from `localStorage`, ready for real API calls to be added
- Responsive layout: sidebar collapses into a slide-over drawer below the `lg` breakpoint
- Placeholder pages for every module (Dashboard, Products, Categories, Suppliers,
  Customers, Purchases, Sales, Stock, Reports, Shop Settings)

## What's intentionally NOT included yet

- Login is not functional (form fields are disabled)
- No pages call the backend API yet
- No CRUD tables/forms yet
- No barcode camera scanning
- No PWA setup

## Adding a new page later

1. Create the page component in `src/pages/`
2. Add a `<Route>` for it in `src/routes/AppRoutes.jsx`
3. Add a nav entry in `src/layout/Sidebar.jsx` (`navItems` array)
4. Add its title to the `pageTitles` map in `src/layout/MainLayout.jsx`
