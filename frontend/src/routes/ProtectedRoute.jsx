import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute now does TWO checks, both optional-but-layered:
 *
 * 1. TOKEN CHECK (unchanged from before): no "token" in localStorage ->
 *    redirect to /login. This still guards the outer <MainLayout> wrap in
 *    AppRoutes.jsx exactly as before.
 *
 * 2. ROLE CHECK (new, opt-in via `allowedRoles`): if `allowedRoles` is
 *    passed, we also read the saved "user" object from localStorage and
 *    check `user.role` against that list. If the role isn't allowed, we
 *    redirect to `fallback` (defaults to "/sales", since that's the one
 *    page every logged-in role in this app is allowed to reach) instead of
 *    rendering the page.
 *
 * If `allowedRoles` is NOT passed, ProtectedRoute behaves exactly as
 * before — only the token check applies. This is how the outer
 * <ProtectedRoute><MainLayout /></ProtectedRoute> in AppRoutes.jsx keeps
 * working unchanged; role restrictions are added per-page instead, by
 * wrapping individual page elements with their own allowedRoles.
 */
export default function ProtectedRoute({ children, allowedRoles, fallback = "/sales" }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const role = savedUser?.role;

    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}