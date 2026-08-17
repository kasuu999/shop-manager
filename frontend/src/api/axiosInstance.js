import axios from "axios";

/**
 * ONE shared Axios instance for the whole app.
 *
 * Why this exists: instead of writing `axios.get("http://localhost:3000/api/...")`
 * everywhere (and having to update every file if the backend URL ever
 * changes), every page/component imports THIS file and calls
 * `api.get("/products")`, `api.post("/sales", data)`, etc. The base URL and
 * the "attach the JWT token" logic live in exactly one place.
 *
 * NOTE: this file does NOT make any real API calls yet — that's for the
 * next step, when we wire up actual pages. This is just the reusable
 * instance, ready to be used.
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the JWT token (once login is implemented and a
// token is saved) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
