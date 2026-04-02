import { Request, Response } from "express";

const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AI Life OS API is healthy",
  });
};

export { getHealth };
