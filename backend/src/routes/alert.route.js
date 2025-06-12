import { Router } from 'express';
import { sendAlert,getAlert,deactivateAlert,deleteAlert } from '../controllers/alert.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyRole } from '../middlewares/verifyrole.middleware.js';

const router = Router()
router.route("/create").post(verifyJWT, verifyRole("armyofficial"), sendAlert);
router.route("/deactivate/:id").patch(verifyJWT, verifyRole("armyofficial"), deactivateAlert);
router.route("/delete/:id").delete(verifyJWT, verifyRole("armyofficial"), deleteAlert);

router.route("/region/:region").get(verifyJWT, getAlert); 


export default router