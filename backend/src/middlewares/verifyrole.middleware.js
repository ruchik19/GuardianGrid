
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const verifyRole = (requiredRole) => {
  return asyncHandler((req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      throw new ApiError(403, "Forbidden: Insufficient permissions");
    }
    next();
  });
};

