import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../utils/errors.js";

export async function authenticate(req, res, next) {
  try {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check if the header exists and has "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Access denied. No token provided."));
    }

    // 3. Extract the token
    const token = authHeader.split(" ")[1];

    // 4. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // 5. Find the user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new UnauthorizedError("Invalid token: user not found."));
    }

    // 6. Check account status
    if (user.accountStatus !== "active") {
      return next(new ForbiddenError("Account is suspended."));
    }

    // 7. Put useful user information in req.user
    req.user = {
      id: user._id,
      role: user.role,
    };

    // 8. Continue to the next middleware
    next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired token."));
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }

    next();
  };
}
