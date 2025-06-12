import { Router } from "express";
import { addnewShelter,updateShelter,getSheltersByRegion,deleteShelter } from "../controllers/shelter.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/verifyrole.middleware.js";

const router = Router();

router.route("/create").post(verifyJWT, verifyRole("armyofficial"), addnewShelter);
router.route("/update/:id").patch(verifyJWT, verifyRole("armyofficial"), updateShelter);
router.route("/delete/:id").delete(verifyJWT, verifyRole("armyofficial"), deleteShelter);
router.route("/region/:region").get(verifyJWT, getSheltersByRegion);

export default router