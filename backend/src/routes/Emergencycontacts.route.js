import { Router } from "express";
import {
    createEmergencyContact,
    getEmergencyContactsByRegion,
    deleteEmergencyContact,
    getMyContacts
} from "../controllers/Emergencycontact.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyRole } from "../middlewares/verifyrole.middleware.js";

const router = Router();

router.route("/create").post(verifyJWT, verifyRole("armyofficial"), createEmergencyContact);
router.route('/my-contacts').get(verifyJWT, verifyRole('armyofficial'), getMyContacts);
router.route("/delete/:id").delete(verifyJWT, verifyRole("armyofficial"), deleteEmergencyContact);
router.route("/region/:region").get(verifyJWT, getEmergencyContactsByRegion);

export default router;