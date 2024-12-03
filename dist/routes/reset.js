"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resetController_1 = require("../controllers/resetController");
const router = (0, express_1.Router)();
router.post('/', resetController_1.resetSystem);
exports.default = router;
//# sourceMappingURL=reset.js.map