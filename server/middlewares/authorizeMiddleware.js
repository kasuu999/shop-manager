/**
 * ADD THIS FILE alongside your existing auth middleware
 * (e.g. in the same folder as middlewares/userMiddlware.js)
 *
 * This does NOT touch JWT generation or the existing `protect` middleware.
 * `protect` answers "who is this user?" (authentication) and sets
 * `req.user`. This new `authorize` middleware answers "is this user ALLOWED
 * to do this?" (authorization) — it must always run AFTER `protect`,
 * because it depends on `req.user.role` already being set.
 */

// Usage: authorize("owner")  or  authorize("owner", "staff")
// Pass in the role(s) that are allowed to access a route.
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Safety check — if this ever runs before `protect`, req.user won't exist.
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: "Not authorized, no user found" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. sirf owner kr skta hai staff nahi: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};