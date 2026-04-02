import { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma";

const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const { title, content } = req.body ?? {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Note title is required",
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const note = await prisma.note.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    return next(error);
  }
};

const getNotes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    return next(error);
  }
};

const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    return next(error);
  }
};

const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);
    const { title, content } = req.body ?? {};

    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Note title cannot be empty",
      });
    }

    if (content !== undefined && !String(content).trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot be empty",
      });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existingNote.title,
        content:
          content !== undefined ? String(content).trim() : existingNote.content,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: updatedNote,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.userId as string;
    const id = String(req.params.id);

    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
