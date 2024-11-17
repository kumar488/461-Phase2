import { Request, Response } from 'express';

export const getTracks = (req: Request, res: Response) => {
    // Return the list of tracks
    res.json({ tracks: ['track1', 'track2'] });
};
