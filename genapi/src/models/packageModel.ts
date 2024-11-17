import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

export const getAllPackages = async () => {
    const [rows] = await pool.query('SELECT * FROM packages');
    return rows;
};

export const getPackage = async (id: string) => {
    const [rows, fields]: [any[], any[]] = await pool.query('SELECT * FROM packages WHERE id = ?', [id]);
    return rows[0];
};

export const createPackageModel = async (pkg: any) => {
    const [result] = await pool.query('INSERT INTO packages SET ?', pkg);
    return result;
};

export const deletePackageModel = async (id: string) => {
    const [result] = await pool.query('DELETE FROM packages WHERE id = ?', [id]);
    return result;
};
