import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getWarDetails } from "../controllers/pastWars.controllers.js";

const router = Router();
router.route("/getwar").get(verifyJWT, getWarDetails);
export default router;