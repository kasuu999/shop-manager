import { Navigate } from "react-router-dom";

// This component receives MainLayout as `children` (see AppRoutes.jsx:
// <ProtectedRoute><MainLayout /></ProtectedRoute>). It MUST render that
// children prop — if it doesn't, MainLayout (and the Sidebar/Header inside
// it) never renders at all, even though the page content still shows up
// via MainLayout's own <Outlet />.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}