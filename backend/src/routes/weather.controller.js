
import {Router} from 'express';
const router = Router();

import { verifyJWT } from '../middlewares/auth.middleware.js'; 
import { getWeatherData } from '../controllers/weather.controller.js'; 
router.route('/weather').get( verifyJWT, getWeatherData);

export default router;