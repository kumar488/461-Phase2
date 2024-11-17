import { Request, Response } from 'express';
import { getAllPackages, getPackage, createPackageModel, deletePackageModel } from '../models/packageModel';

export const createPackage = async (req: Request, res: Response) => {
    try {
        const newPackage = req.body;

        if (!newPackage.name || !newPackage.version) {
            res.status(400).json({ error: 'Missing required fields: name and/or version' });
        }

        const createdPackage = await createPackageModel(newPackage);
        res.status(201).json({ message: 'Package created', package: createdPackage });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getPackageById = async (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        const pkg = await getPackage(packageId);

        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }

        res.status(200).json(pkg);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updatePackage = (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;
        const updates = req.body;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        if (!updates) {
            res.status(400).json({ error: 'No update information provided' });
        }

        // Assume we have a model function to update a package
        // updatePackageModel(packageId, updates);

        res.status(200).json({ message: 'Package updated', packageId, updates });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deletePackage = async (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        const pkg = await deletePackageModel(packageId);

        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }

        res.status(200).json({ message: 'Package deleted', packageId });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getPackageRate = (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;
        const authorizationHeader = req.headers['x-authorization'];

        if (!authorizationHeader) {
            res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        }

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        // Logic to fetch the package's rating
        if (packageId === '1') {
            res.status(200).json({ packageId, rating: 4.5 });
        } else {
            res.status(404).json({ error: 'Package does not exist.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
    }
};

export const getPackageCost = (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        // Cost calculation logic
        res.status(200).json({ cost: 100 });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const searchPackagesByRegEx = (req: Request, res: Response) => {
    try {
        const { regex } = req.body;

        if (!regex) {
            res.status(400).json({ error: 'Missing required field: regex' });
        }

        // Logic to search for packages based on regex
        res.status(200).json({ packages: [] });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
