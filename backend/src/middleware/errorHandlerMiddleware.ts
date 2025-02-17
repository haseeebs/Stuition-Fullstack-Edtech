// Node modules
import { ZodError } from "zod";
import { NextFunction, Request, Response } from "express";

// Utilities
import ExpressError from "utils/ExpressError.js";

// Middleware
const errorHandlerMiddleware = (err: ExpressError, req: Request, res: Response, next: NextFunction) => {
    const { statusCode = 500, message = "Something went wrong..." } = err;
    console.log(`Error message: ${err.message}`);

  // Log the error stack only in development mode
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Handle ZodError
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.errors.map(error => `${error.path}: ${error.message}`)
    });
  }

  // Handle custom ExpressError
  if (err instanceof ExpressError) {
    return res.status(statusCode).json({
      success: false,
      message: message,
    });
  }

  // Default to general error response
  res.status(statusCode).json({
    success: false,
    message: message,
    statusCode,
  });
};

export default errorHandlerMiddleware;