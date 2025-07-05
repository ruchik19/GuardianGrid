import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import axios from "axios";

const WIKIPEDIA_API_ENDPOINT = "https://en.wikipedia.org/w/api.php";

const getWarDetails = asyncHandler(async (req, res) => {
    const warName  = req.query.warName; 

    if (!warName) {
        throw new ApiError(400, "War name is required.");
    }

    try {
        const summaryResponse = await axios.get(WIKIPEDIA_API_ENDPOINT, {
            params: {
                action: 'query',
                format: 'json',
                prop: 'extracts|pageimages',
                pithumbsize: 300,
                exintro: true, 
                explaintext: true, 
                redirects: 1, 
                titles: warName, 
            }
        });

        const pages = summaryResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageData = pages[pageId];
        const imageUrl = pageData.thumbnail ? pageData.thumbnail.source : null;

        if (pageId === '-1') {
            throw new ApiError(404, `No Wikipedia article found for "${warName}".`);
        }

        const warDetails = {
            title: pageData.title,
            summary: pageData.extract,
            wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageData.title.replace(/ /g, '_'))}` ,
            imageUrl: imageUrl
        };

        return res.status(200).json(new ApiResponse(200, warDetails, "War details retrieved successfully from Wikipedia."));

    } catch (error) {
        console.error("Error fetching war details from Wikipedia:", error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to retrieve war details from Wikipedia API.");
    }
});

export { getWarDetails }

