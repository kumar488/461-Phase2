import { Router } from 'express';
import { resetSystem } from '../controllers/resetController';

const router = Router();

router.post('/', resetSystem);

export default router;
