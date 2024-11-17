import { Request, Response } from 'express';

export const resetSystem = (req: Request, res: Response) => {
    // Logic to reset the system
    res.json({ message: 'System reset successfully' });
};
