import { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";

const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const { title, description, completed } = req.body ?? {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        completed: Boolean(completed),
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};

const getTasks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return next(error);
  }
};

const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);
    const { title, description, completed } = req.body ?? {};

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot be empty",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existingTask.title,
        description:
          description !== undefined
            ? description
              ? String(description).trim()
              : null
            : existingTask.description,
        completed:
          completed !== undefined ? Boolean(completed) : existingTask.completed,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export { createTask, deleteTask, getTaskById, getTasks, updateTask };
