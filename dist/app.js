"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
const authenticate_1 = __importDefault(require("./routes/authenticate"));
const reset_1 = __importDefault(require("./routes/reset"));
const package_1 = __importDefault(require("./routes/package"));
const packages_1 = __importDefault(require("./routes/packages"));
const tracks_1 = __importDefault(require("./routes/tracks"));
app.use('/authenticate', authenticate_1.default);
app.use('/reset', reset_1.default);
app.use('/package', package_1.default);
app.use('/packages', packages_1.default);
app.use('/tracks', tracks_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map