import { Router } from 'express';
import { getTracks } from '../controllers/tracksController';

const router = Router();

router.get('/', getTracks);

export default router;
