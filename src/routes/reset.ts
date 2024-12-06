import { Router } from 'express';
import { resetSystem } from '../controllers/resetController';

const router = Router();

router.delete('/', resetSystem);

export default router;
