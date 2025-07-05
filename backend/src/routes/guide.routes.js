
import {Router} from 'express'; 
const router = Router();

import { verifyJWT } from '../middlewares/auth.middleware.js'; 
import {verifyRole} from '../middlewares/verifyrole.middleware.js'; 
import { getGuideList, getGuideContent } from '../controllers/guide.controller.js'; 

router.get('/', verifyJWT, getGuideList);
router.get('/:guideId', verifyJWT, getGuideContent);

export default router; 
