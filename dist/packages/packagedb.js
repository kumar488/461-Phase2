"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.tableCreationQuery = exports.tableName = exports.config = void 0;
exports.createConnection = createConnection;
exports.initializeTables = initializeTables;
exports.createDatabase = createDatabase;
exports.addPackage = addPackage;
exports.deletePackage = deletePackage;
exports.updatePackage = updatePackage;
exports.getPackageByID = getPackageByID;
exports.resetTable = resetTable;
const mysql = __importStar(require("mysql2/promise"));
const logger_1 = __importDefault(require("../logger"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.config = {
    host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
};
exports.tableName = 'packages';
exports.tableCreationQuery = `
    CREATE TABLE IF NOT EXISTS ${exports.tableName} (
        Name VARCHAR(255) NOT NULL,
        Version VARCHAR(255) NOT NULL,
        ID INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
        URL TEXT NULL,
        Content LONGTEXT NULL,
        JSProgram MEDIUMTEXT NULL,
        NET_SCORE FLOAT NULL,
        RAMP_UP_SCORE FLOAT NULL,
        CORRECTNESS_SCORE FLOAT NULL,
        BUS_FACTOR_SCORE FLOAT NULL,
        RESPONSIVE_MAINTAINER_SCORE FLOAT NULL,
        LICENSE_SCORE INT NULL,
        PINNED_PRACTICE_SCORE FLOAT NULL,
        PULL_REQUEST_RATING_SCORE FLOAT NULL
    );
`;
function createConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.default.info('Connecting to database');
            const connection = yield mysql.createConnection(exports.config);
            logger_1.default.info('Connected to database');
            return connection;
        }
        catch (err) {
            logger_1.default.info('Error connecting to database', err);
            throw err;
        }
    });
}
function initializeTables() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield createConnection();
        try {
            yield connection.query(exports.tableCreationQuery);
            logger_1.default.info('Table created');
        }
        catch (err) {
            logger_1.default.info('Error creating table', err);
            throw err;
        }
        finally {
            connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
function createDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        let initialConnection;
        try {
            logger_1.default.info('Connecting to server to initialize database');
            initialConnection = yield mysql.createConnection(Object.assign(Object.assign({}, exports.config), { database: undefined }));
            yield initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${exports.config.database}`);
            logger_1.default.info(`Database ${exports.config.database} created or already exists`);
            initialConnection = yield mysql.createConnection(exports.config);
            yield initialConnection.query(exports.tableCreationQuery);
            logger_1.default.info(`Table '${exports.tableName}' created or already exists`);
        }
        catch (err) {
            logger_1.default.info('Error initializing database or creating table', err);
            throw err;
        }
        finally {
            if (initialConnection) {
                yield initialConnection.end();
            }
            logger_1.default.info('Initial connection closed after database and table setup');
        }
    });
}
function addPackage(packageData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const connection = yield createConnection();
        try {
            // Check for duplicate package (by Name and Version)
            const [rows] = yield connection.execute(`SELECT COUNT(*) as count FROM ${exports.tableName} WHERE Name = ? AND Version = ?`, [packageData.Name, packageData.Version]);
            const count = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            if (count > 0) {
                throw { code: 409, message: 'Package already exists' };
            }
            // Include rate checking here
            // Insert the package
            const fields = [];
            const values = [];
            const placeholders = [];
            for (const key in packageData) {
                if (packageData[key] !== undefined) {
                    fields.push(key);
                    values.push(packageData[key]);
                    placeholders.push('?');
                }
            }
            const query = `INSERT INTO ${exports.tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            const [result] = yield connection.execute(query, values);
            const insertedId = result.insertId;
            logger_1.default.info(`New row added to table with ID ${insertedId}`);
            return { id: insertedId };
        }
        catch (err) {
            if (err.code)
                throw err; // Custom error codes
            logger_1.default.error('Error adding row to table', err);
            throw { code: 500, message: 'Internal Server Error' }; // General server error
        }
        finally {
            yield connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
function deletePackage(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield createConnection();
        try {
            const query = `DELETE FROM ${exports.tableName} WHERE ID = ?`;
            const [result] = yield connection.execute(query, [id]);
            // Check if a row was actually deleted
            const affectedRows = result.affectedRows;
            if (affectedRows === 0) {
                throw new Error(`No package found with ID ${id}`);
            }
            logger_1.default.info(`Row with ID ${id} deleted`);
        }
        catch (err) {
            logger_1.default.error('Error deleting row', err);
            throw err;
        }
        finally {
            yield connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
function updatePackage(id, updateData) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield createConnection();
        try {
            // Build the SET clause dynamically
            const updates = [];
            const values = [];
            for (const key in updateData) {
                if (updateData[key] !== undefined) { // Only include provided fields
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            }
            // Ensure there's something to update
            if (updates.length === 0) {
                throw new Error('No fields provided to update');
            }
            // Add the ID to the values array
            values.push(id);
            // Build the query
            const query = `
            UPDATE ${exports.tableName} 
            SET ${updates.join(', ')}
            WHERE ID = ?
        `;
            // Execute the query
            const [result] = yield connection.execute(query, values);
            // Check if a row was actually updated
            const affectedRows = result.affectedRows;
            if (affectedRows === 0) {
                throw new Error(`No package found with ID ${id}`);
            }
            logger_1.default.info(`Row with ID ${id} updated`);
        }
        catch (err) {
            logger_1.default.error('Error updating row', err);
            throw err;
        }
        finally {
            yield connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
function getPackageByID(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield createConnection();
        try {
            const query = `SELECT * FROM ${exports.tableName} WHERE ID = ?`;
            const [rows] = yield connection.execute(query, [id]);
            logger_1.default.info(`Row with ID ${id} retrieved`);
            return rows;
        }
        catch (err) {
            logger_1.default.error('Error retrieving row', err);
            throw err;
        }
        finally {
            yield connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
function resetTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield createConnection();
        try {
            yield connection.query(`TRUNCATE TABLE ${exports.tableName}`);
            logger_1.default.info('Table reset: all rows deleted, ID restarted');
        }
        catch (err) {
            logger_1.default.error('Error resetting table', err);
            throw err;
        }
        finally {
            yield connection.end();
            logger_1.default.info('Connection closed');
        }
    });
}
//# sourceMappingURL=packagedb.js.map