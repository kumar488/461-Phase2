import { Router } from 'express';
import { authenticate } from '../controllers/authenticateController';

const router = Router();

router.post('/', authenticate);

export default router;
