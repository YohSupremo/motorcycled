import jwt from "jsonwebtoken";
import User from "../model/User.js";

// Protects routes: requires a valid JWT in the "token" cookie.
export const auth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        message: "Login first to access this resource",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
        success: false,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handles expired and malformed tokens gracefully.
    return res.status(401).json({
      message: "Invalid or expired token, please login again",
      success: false,
    });
  }
};

// Restricts a route to a specific set of roles (e.g. authorizeRoles("admin")).
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user?.role || "unknown"}) is not allowed to access this resource`,
        success: false,
      });
    }
    next();
  };
};