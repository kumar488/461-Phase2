import { Router } from 'express';
import { 
    createPackage, 
    getPackageById, 
    updatePackage, 
    getPackageRate,
    getPackageCost, 
    searchPackagesByRegEx 
} from '../controllers/packageController';

const router = Router();

router.post('/byRegEx', searchPackagesByRegEx);
router.post('/', createPackage);
router.get('/:id', getPackageById);
router.post('/:id', updatePackage);
router.get('/:id/rate', getPackageRate);
router.get('/:id/cost', getPackageCost);

export default router;