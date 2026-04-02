import { NextFunction, Request, Response } from "express";

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export { errorHandler };
