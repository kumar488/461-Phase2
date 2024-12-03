"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTracks = void 0;
const getTracks = (req, res) => {
    // Return the list of tracks
    res.json({ tracks: ['track1', 'track2'] });
};
exports.getTracks = getTracks;
//# sourceMappingURL=tracksController.js.map