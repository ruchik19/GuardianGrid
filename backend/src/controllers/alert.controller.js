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
        severity: severity ? severity.toLowerCase() : 'medium', 
        targetRegions: processedTargetRegions,
        location: location ? { type: 'Point', coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)] } : undefined,
        createdBy: req.user._id, 
        isActive: true, 
    });

    console.log("Alert created in DB:", newAlert);
    if (!io) {
        console.error("Socket.IO instance (io) is null in alert.controller.js!");
    } else {
        console.log(`Attempting to emit new_alert_in_region for regions: ${processedTargetRegions.join(', ')}`);
        for (const region of processedTargetRegions) {
            io.to(region).emit('new_alert_in_region', newAlert);
            console.log(`Emitted 'new_alert_in_region' to room: ${region} with alert ID: ${newAlert._id}`);
        }
    io.emit('global_alert_feed_update', { action: 'created', alert: newAlert });
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
    const region = req.params.region
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
    try {
        const { id } = req.params;
        const { isActive } = req.body; 

        const alert = await Alert.findById(id);
        if (!alert) {
            throw new ApiError(404,"alert not found .");
        }
        if (alert.createdBy.toString() !== req.user._id.toString()) {
            throw new ApiError(404,'You are not authorized to change the status of this alert.' );
        }

        alert.isActive = isActive;
        await alert.save();
        
        if (io) {
            alert.targetRegions.forEach(region => {
                io.to(region.toLowerCase()).emit('alert_deactivated_in_region', { alertId: alert._id, isActive: alert.isActive });
            });
            io.to('global').emit('alert_deactivated_in_region', { alertId: alert._id, isActive: alert.isActive });
        }

        res.status(200).json({
            status: 'success',
            message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully!`,
            data: alert,
        });
    } catch (err) {
        console.error('Error toggling alert status:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to toggle alert status.',
            error: err.message,
        });
    }
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

const getMyAlerts = asyncHandler(async (req, res) => {
    try {
        const myAlerts = await Alert.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: myAlerts.length,
            data: myAlerts,
        });
    } catch (err) {
        console.error('Error fetching my alerts:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve your alerts.',
            error: err.message,
        });
    }
});


export { sendAlert, getAlert, deactivateAlert, deleteAlert,getMyAlerts }