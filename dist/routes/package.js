"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const packageController_1 = require("../controllers/packageController");
const router = (0, express_1.Router)();
router.post('/', packageController_1.createPackage);
router.get('/:id', packageController_1.getPackageById);
router.put('/:id', packageController_1.updatePackage);
router.delete('/:id', packageController_1.deletePackage); // Extra route
router.get('/:id/rate', packageController_1.getPackageRate);
router.get('/:id/cost', packageController_1.getPackageCost);
router.post('/byRegEx', packageController_1.searchPackagesByRegEx);
exports.default = router;
//# sourceMappingURL=package.js.map