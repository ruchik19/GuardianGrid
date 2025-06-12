import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { Alert } from "../models/alert.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


let io = null;
export const setSocketInstance = (socketInstance) => {
  io = socketInstance;
};


const sendAlert = asyncHandler(async(req,res)=> {
    const { title, message, type, severity, targetRegions, location } = req.body;

    if (!io) {
        console.error("Socket.IO instance not available in alertController!");
        throw new ApiError(500, "Real-time communication not available.");
    }

    if (!title || !message || !type || !targetRegions || targetRegions.length === 0) {
        throw new ApiError(400, 'Title, message, type, and target regions are required.');
    }
    const processedTargetRegions = targetRegions.map(r => r.toLowerCase());

    const newAlert = await Alert.create({
        title,
        message,
        type: type.toLowerCase(),
        severity: severity ? severity.toLowerCase() : 'medium', // Default to medium
        targetRegions: processedTargetRegions,
        location: location ? { type: 'Point', coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)] } : undefined,
        issuedBy: req.user._id, // User from verifyJWT middleware
        isActive: true, // Default to active upon creation
    });

    if (io) {
        for (const region of processedTargetRegions) {
            io.to(region).emit('new_alert_in_region', newAlert);
            console.log(`Emitting 'new_alert_in_region' to room: ${region}`);
        }
    }
    return res
    .status(201)
    .json(new ApiResponse (
        201,
        newAlert,
        "Alert sent successfully"
    ))
})

const getAlert = asyncHandler(async(req,res)=>{
    const {region} = req.params.region
    if (!region) {
        throw new ApiError(400, "Region parameter is required.");
    }
    const alerts = await Alert.find({
        isActive: true,
        targetRegions: { $in: [region.toLowerCase(), 'global'] }
    }).sort({ createdAt: -1 });
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        alerts,
        "recieved successfully"
    ))

})

const deactivateAlert = asyncHandler(async (req, res) => {
    const { id } = req.params; 

    const alert = await Alert.findById(id);

    if (!alert) {
        throw new ApiError(404, "Alert not found.");
    }

    if (!alert.isActive) {
        throw new ApiError(400, "Alert is already inactive.");
    }

    alert.isActive = false;
    await alert.save(); 

    if (io) {
        for (const region of alert.targetRegions) {
            io.to(region).emit('alert_deactivated_in_region', { alertId: alert._id, region });
            console.log(`Emitting 'alert_deactivated_in_region' to room: ${region}`);
        }
        io.emit('global_alert_feed_update', { alertId: alert._id, action: 'deactivated' });
    }

    return res
        .status(200)
        .json(new ApiResponse(
          200, 
          alert, 
          "Alert deactivated successfully"
        ));
});

const deleteAlert = asyncHandler(async (req, res) => {
    const { id } = req.params; 

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
        throw new ApiError(404, "Alert not found.");
    }

    if (io) {
        for (const region of alert.targetRegions) {
            io.to(region).emit('alert_deleted_in_region', { alertId: alert._id, region });
        }
        io.emit('global_alert_feed_update', { alertId: alert._id, action: 'deleted' });
    }

    return res
        .status(200)
        .json(new ApiResponse(
          200, 
          {}, 
          "Alert deleted successfully"
        ));
});


export { sendAlert, getAlert, deactivateAlert, deleteAlert }