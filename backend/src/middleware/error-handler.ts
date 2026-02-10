import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[error]", err.message);

  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    ok: false,
    type: "generic",
    message:
      statusCode >= 500
        ? "An unexpected server error occurred. Please try again."
        : err.message,
  });
}