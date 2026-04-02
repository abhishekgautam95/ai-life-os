import { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";

const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const { title, description, completed } = req.body ?? {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Goal title is required",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        completed: Boolean(completed),
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Goal created successfully",
      data: goal,
    });
  } catch (error) {
    return next(error);
  }
};

const getGoals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    return next(error);
  }
};

const getGoalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    return next(error);
  }
};

const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);
    const { title, description, completed } = req.body ?? {};

    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Goal title cannot be empty",
      });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existingGoal.title,
        description:
          description !== undefined
            ? description
              ? String(description).trim()
              : null
            : existingGoal.description,
        completed:
          completed !== undefined ? Boolean(completed) : existingGoal.completed,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data: updatedGoal,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const existingGoal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export { createGoal, deleteGoal, getGoalById, getGoals, updateGoal };
