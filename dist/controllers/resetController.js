"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSystem = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
// Default system credentials for resetting the database
const DEFAULT_DB_CONFIG = {
    host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'ECE461Pass*',
    database: 'ece461'
};
const resetSystem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create a connection using the default credentials
        const connection = yield promise_1.default.createConnection(DEFAULT_DB_CONFIG);
        // Begin a transaction
        yield connection.beginTransaction();
        // Delete all rows from the packages table
        yield connection.query('DELETE FROM packages');
        // Delete all users except the default user
        yield connection.query('DELETE FROM users WHERE username != ?', ['default_user']);
        // Insert or reset the default user (assuming username is 'default_user')
        yield connection.query(`
            INSERT INTO users (username, password)
            VALUES ('default_user', 'default_password')
            ON DUPLICATE KEY UPDATE password='default_password';
        `);
        // Commit the transaction
        yield connection.commit();
        yield connection.end();
        res.status(200).json({ message: 'System reset to default state successfully' });
    }
    catch (error) {
        console.error('Error during system reset:', error);
        res.status(500).json({ error: 'Internal Server Error during system reset' });
    }
});
exports.resetSystem = resetSystem;
//# sourceMappingURL=resetController.js.map