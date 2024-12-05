"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tracksController_1 = require("../controllers/tracksController");
const router = (0, express_1.Router)();
router.get('/', tracksController_1.getTracks);
exports.default = router;
//# sourceMappingURL=tracks.js.map