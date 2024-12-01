import * as mysql from 'mysql2/promise';
import logger from '../logger';
import * as dotenv from 'dotenv';

dotenv.config();

export interface PackageData {
    Name?: string;
    Version?: string;
    URL?: string;
    Content?: string;
    JSProgram?: string;
    NET_SCORE?: number;
    RAMP_UP_SCORE?: number;
    CORRECTNESS_SCORE?: number;
    BUS_FACTOR_SCORE?: number;
    RESPONSIVE_MAINTAINER_SCORE?: number;
    LICENSE_SCORE?: number;
    PINNED_PRACTICE_SCORE?: number;
    PULL_REQUEST_RATING_SCORE?: number;
  }

export const config = {
    host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
};

export const tableName = 'packages';
export const tableCreationQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
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

export async function createConnection() {
    try {
        logger.info('Connecting to database');
        const connection = await mysql.createConnection(config);
        logger.info('Connected to database');
        return connection;    
    } catch (err) {
        logger.info('Error connecting to database', err);
        throw err;
    }
}

export async function initializeTables() {
    const connection = await createConnection();
    try {
        await connection.query(tableCreationQuery);
        logger.info('Table created');
    } catch (err) {
        logger.info('Error creating table', err);
        throw err;
    } finally {
        connection.end();
        logger.info('Connection closed');
    }
}

export async function createDatabase() {
    let initialConnection;
    try {
        logger.info('Connecting to server to initialize database');
        initialConnection = await mysql.createConnection({
            ...config,
            database: undefined, // Connect without specifying a database initially
        });

        await initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        logger.info(`Database ${config.database} created or already exists`);

        initialConnection = await mysql.createConnection(config);
        await initialConnection.query(tableCreationQuery);
        logger.info(`Table '${tableName}' created or already exists`);

    } catch (err) {
        logger.info('Error initializing database or creating table', err);
        throw err;
    } finally {
        if (initialConnection) {
            await initialConnection.end();
        }
        logger.info('Initial connection closed after database and table setup');
    }
}

export async function addPackage(packageData: PackageData) {
    const connection = await createConnection();
    try {
      // Check for duplicate package (by Name and Version)
      const [rows] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE Name = ? AND Version = ?`,
        [packageData.Name, packageData.Version]
      );
      const count = (rows as any)[0]?.count || 0;
      if (count > 0) {
        throw { code: 409, message: 'Package already exists' };
      }
  
      // Include rate checking here
  
      // Insert the package
      const fields: string[] = [];
      const values: (string | number)[] = [];
      const placeholders: string[] = [];
      for (const key in packageData) {
        if (packageData[key as keyof PackageData] !== undefined) {
          fields.push(key);
          values.push(packageData[key as keyof PackageData] as string | number);
          placeholders.push('?');
        }
      }
  
      const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result] = await connection.execute(query, values);
  
      const insertedId = (result as any).insertId;
      logger.info(`New row added to table with ID ${insertedId}`);
  
      return { id: insertedId };
    } catch (err: any) {
      if (err.code) throw err; // Custom error codes
      logger.error('Error adding row to table', err);
      throw { code: 500, message: 'Internal Server Error' }; // General server error
    } finally {
      await connection.end();
      logger.info('Connection closed');
    }
}

export async function deletePackage(id: number) {
    const connection = await createConnection();
    try {
        const query = `DELETE FROM ${tableName} WHERE ID = ?`;
        const [result] = await connection.execute(query, [id]);

        // Check if a row was actually deleted
        const affectedRows = (result as any).affectedRows;
        if (affectedRows === 0) {
            throw new Error(`No package found with ID ${id}`);
        }

        logger.info(`Row with ID ${id} deleted`);
    } catch (err) {
        logger.error('Error deleting row', err);
        throw err;
    } finally {
        await connection.end();
        logger.info('Connection closed');
    }
}

export async function updatePackage(id: number, updateData: PackageData) {
    const connection = await createConnection();
    try {
        // Build the SET clause dynamically
        const updates: string[] = [];
        const values: (string | number)[] = [];

        for (const key in updateData) {
            if (updateData[key as keyof PackageData] !== undefined) { // Only include provided fields
                updates.push(`${key} = ?`);
                values.push(updateData[key as keyof PackageData] as string | number);
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
            UPDATE ${tableName} 
            SET ${updates.join(', ')}
            WHERE ID = ?
        `;

        // Execute the query
        const [result] = await connection.execute(query, values);

        // Check if a row was actually updated
        const affectedRows = (result as any).affectedRows;
        if (affectedRows === 0) {
            throw new Error(`No package found with ID ${id}`);
        }

        logger.info(`Row with ID ${id} updated`);
    } catch (err) {
        logger.error('Error updating row', err);
        throw err;
    } finally {
        await connection.end();
        logger.info('Connection closed');
    }
}
  

export async function getPackageByID(id: number) {
    const connection = await createConnection();
    try {
        const query = `SELECT * FROM ${tableName} WHERE ID = ?`;
        const [rows] = await connection.execute(query, [id]);
        logger.info(`Row with ID ${id} retrieved`);
        return rows as PackageData[];
    } catch (err) {
        logger.error('Error retrieving row', err);
        throw err;
    } finally {
        await connection.end();
        logger.info('Connection closed');
    }
}

export async function resetTable() {
    const connection = await createConnection();
    try {
        await connection.query(`TRUNCATE TABLE ${tableName}`);
        logger.info('Table reset: all rows deleted, ID restarted');
    } catch (err) {
        logger.error('Error resetting table', err);
        throw err;
    } finally {
        await connection.end();
        logger.info('Connection closed');
    }
}