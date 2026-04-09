import { ReviewStatus, User } from "@prisma/client";

import { generateReviewSummary } from "../ai/coach";
import { ReviewCandidate } from "../ai/types";
import { prisma } from "../config/prisma";
import { getDayKey } from "../utils/time";
import { taskService } from "./taskService";

class ReviewService {
  async createReview(user: User, review: ReviewCandidate, originalText: string) {
    await taskService.applyReviewStatus(user.id, {
      completed: review.completed,
      partial: review.partial,
      skipped: review.skipped,
    });

    const context = JSON.stringify(
      {
        user: {
          name: user.name,
          timezone: user.timezone,
        },
        review,
        originalText,
      },
      null,
      2
    );

    const aiSummary = await generateReviewSummary(context);
    const summary = aiSummary?.summary || review.summary || originalText;
    const dayKey = getDayKey(new Date(), user.timezone);

    const saved = await prisma.dailyReview.upsert({
      where: {
        userId_dayKey: {
          userId: user.id,
          dayKey,
        },
      },
      update: {
        date: new Date(),
        status: review.status,
        completed: review.completed,
        partial: review.partial,
        skipped: review.skipped,
        summary,
      },
      create: {
        userId: user.id,
        dayKey,
        date: new Date(),
        status: review.status,
        completed: review.completed,
        partial: review.partial,
        skipped: review.skipped,
        summary,
      },
    });

    return {
      review: saved,
      summary: aiSummary || {
        summary,
        wins: review.completed,
        blockers: review.skipped,
        nextStep:
          review.partial[0] || review.skipped[0] || "Plan tomorrow before you stop.",
      },
    };
  }

  buildReviewPrompt(user: User) {
    return [
      `Evening review for ${user.name}.`,
      "Reply in one message with:",
      "- completed",
      "- partial",
      "- skipped",
      "- one blocker to fix tomorrow",
    ].join("\n");
  }

  fallbackReviewFromText(text: string): ReviewCandidate {
    const lowered = text.toLowerCase();
    const completed =
      text.match(/completed[:\-]\s*(.*)/i)?.[1]
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [];
    const partial =
      text.match(/partial[:\-]\s*(.*)/i)?.[1]
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [];
    const skipped =
      text.match(/skipped[:\-]\s*(.*)/i)?.[1]
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [];

    let status: ReviewStatus = ReviewStatus.MIXED;
    if (lowered.includes("all completed")) {
      status = ReviewStatus.COMPLETED;
    } else if (lowered.includes("skipped everything")) {
      status = ReviewStatus.SKIPPED;
    } else if (lowered.includes("partial")) {
      status = ReviewStatus.PARTIAL;
    }

    return {
      status,
      completed,
      partial,
      skipped,
      summary: text.trim(),
    };
  }
}

const reviewService = new ReviewService();

export { reviewService };
