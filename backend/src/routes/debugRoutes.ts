import { Router } from "express";

import { getDebugUsers, postDebugMessage } from "../controllers/debugController";

const debugRouter = Router();

debugRouter.get("/users", getDebugUsers);
debugRouter.post("/message", postDebugMessage);

export { debugRouter };
