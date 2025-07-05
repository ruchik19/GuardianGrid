
import { promises as fs } from 'fs'; 
import path from 'path';
import { fileURLToPath } from 'url'; 

import {ApiError} from '../utils/ApiError.js';     
import {ApiResponse} from '../utils/ApiResponse.js'; 
import {asyncHandler} from '../utils/asyncHandler.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GUIDES_DIR = path.join(__dirname, '..', 'public', 'guides');
const GUIDE_INDEX_FILE = path.join(GUIDES_DIR, 'guideIndex.json');

export const getGuideList = asyncHandler(async (req, res) => { 
    try {
        const fileContent = await fs.readFile(GUIDE_INDEX_FILE, 'utf8');
        const guides = JSON.parse(fileContent);

        if (!Array.isArray(guides)) {
            console.error("guideIndex.json is not a valid array.");
            throw new ApiError(500, "Invalid guide index configuration.");
        }

        res.status(200).json(new ApiResponse(200, guides, "Guide list retrieved successfully"));
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: guideIndex.json not found at ${GUIDE_INDEX_FILE}`);
            throw new ApiError(500, "Guide index file missing. Please ensure guideIndex.json exists in public/guides.");
        }
        console.error("Error fetching guide list from index file:", error);
        throw new ApiError(500, "Failed to retrieve guide list.");
    }
});

export const getGuideContent = asyncHandler(async (req, res) => { 
    const guideId = req.params.guideId;
    const filePath = path.join(GUIDES_DIR, `${guideId}.json`); 

    try {
        
        await fs.access(filePath); 

        const fileContent = await fs.readFile(filePath, 'utf8');
        const guideData = JSON.parse(fileContent); 

        res.status(200).json(new ApiResponse(200, guideData, "Guide content retrieved successfully"));
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new ApiError(404, `Guide with ID '${guideId}' not found.`);
        }
        console.error(`Error fetching guide content for ${guideId}:`, error);
        throw new ApiError(500, `Failed to retrieve content for guide '${guideId}'.`);
    }
});
