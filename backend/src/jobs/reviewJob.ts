import { User } from "@prisma/client";

import { reviewService } from "../services/reviewService";

const runReviewJob = async (user: User) => reviewService.buildReviewPrompt(user);

export { runReviewJob };
