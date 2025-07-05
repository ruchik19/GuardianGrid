import axios from 'axios';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';

const OPENWEATHER_API_ENDPOINT = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY; 

export const getWeatherData = asyncHandler(async (req, res) => {
    const { region } = req.query; 

    if (!region) {
        throw new ApiError(400, "Region parameter is required for weather data.");
    }

    if (!OPENWEATHER_API_KEY) {
        console.error("OPENWEATHER_API_KEY is not set in environment variables. Check your .env file.");
        throw new ApiError(500, "Server configuration error: Weather API key missing.");
    }

    try {
        const response = await axios.get(OPENWEATHER_API_ENDPOINT, {
            params: {
                q: region, 
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            }
        });

        const weatherData = response.data;

        const extractedData = {
            city: weatherData.name,
            temperature: weatherData.main.temp,
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
            icon: getWeatherEmoji(weatherData.weather[0].icon) 
        };

        res.status(200).json(new ApiResponse(200, extractedData, "Weather data retrieved successfully"));

    } catch (error) {
        console.error(`Error fetching weather data for ${region}:`, error.response?.data || error.message);
        if (error.response?.status === 404) {
            throw new ApiError(404, `Weather data not found for region: ${region}`);
        }
        throw new ApiError(500, `Failed to retrieve weather data for ${region}.`);
    }
});

function getWeatherEmoji(iconCode) {
    switch (iconCode) {
        case '01d': return '☀️'; 
        case '01n': return '🌙'; 
        case '02d': return '🌤️'; 
        case '02n': return '☁️'; 
        case '03d':
        case '03n': return '☁️';
        case '04d':
        case '04n': return ' overcast ☁️';
        case '09d':
        case '09n': return '🌧️'; 
        case '10d':
        case '10n': return '🌦️'; 
        case '11d':
        case '11n': return '⛈️'; 
        case '13d':
        case '13n': return '🌨️';
        case '50d':
        case '50n': return '🌫️'; 
        default: return '❓'; 
    }
}
