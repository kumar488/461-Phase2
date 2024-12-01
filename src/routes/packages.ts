import { Router } from 'express';
import { getPackages } from '../controllers/packagesController';

const router = Router();

router.get('/', getPackages); // Add other routes here

export default router;
