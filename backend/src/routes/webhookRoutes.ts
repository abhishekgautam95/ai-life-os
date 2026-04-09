import { Router } from "express";

import {
  postTelegramWebhook,
  postWhatsAppWebhook,
} from "../controllers/webhookController";

const webhookRouter = Router();

webhookRouter.post("/telegram", postTelegramWebhook);
webhookRouter.post("/whatsapp", postWhatsAppWebhook);

export { webhookRouter };
