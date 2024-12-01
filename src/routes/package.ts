import { Router } from 'express';
import { 
    createPackage, 
    getPackageById, 
    updatePackage, 
    deletePackage, 
    getPackageRate,
    getPackageCost, 
    searchPackagesByRegEx 
} from '../controllers/packageController';

const router = Router();

router.post('/', createPackage);
router.get('/:id', getPackageById);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage); // Extra route
router.get('/:id/rate', getPackageRate);
router.get('/:id/cost', getPackageCost);
router.post('/byRegEx', searchPackagesByRegEx);

export default router;