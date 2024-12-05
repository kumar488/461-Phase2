"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticateController_1 = require("../controllers/authenticateController");
const router = (0, express_1.Router)();
router.post('/', authenticateController_1.authenticate);
exports.default = router;
//# sourceMappingURL=authenticate.js.map