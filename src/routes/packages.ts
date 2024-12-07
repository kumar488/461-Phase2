import { Router } from 'express';
import { getPackages } from '../controllers/packagesController';

const router = Router();

router.post('/', getPackages); // Add other routes here

export default router;
