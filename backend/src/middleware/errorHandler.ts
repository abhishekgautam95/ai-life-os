import { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  logger.error("Request failed", {
    message: error.message,
    stack: error.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message:
      error instanceof AppError ? error.message : "Internal server error",
  });
};

export { errorHandler };
