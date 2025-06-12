import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { EmergencyContact } from "../models/Emergencycontact.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

let io = null;
export const setSocketInstance = (socketInstance) => {
    io = socketInstance;
};

const createEmergencyContact = asyncHandler(async (req, res) => {
    if (!io) {
        console.error("Socket.IO instance not available in emergencyContactController!");
    }

    const { organization, phoneNumber, category, regions } = req.body;

    if ( !organization || !phoneNumber || !category || !regions || regions.length === 0) {
        throw new ApiError(400, "Name, organization, phone number, category, and regions are required.");
    }

    const processedRegions = regions.map(r => r.toLowerCase());

    const existingContact = await EmergencyContact.findOne({ phoneNumber });
    if (existingContact) {
        throw new ApiError(409, "Emergency contact with this phone number already exists.");
    }

    const newContact = await EmergencyContact.create({
        
        organization,
        phoneNumber,
        category: category.toLowerCase(),
        regions: processedRegions,
        updatedBy: req.user._id, 
    });

    if (io) {
        for (const region of processedRegions) {
            io.to(region).emit('emergency_contact_updated_in_region', newContact);
        }
        io.emit('global_emergency_contact_feed_update', newContact);
    }

    return res
        .status(201)
        .json(new ApiResponse(
            201, 
            newContact, 
            "Emergency contact added successfully."
        ));
});

const getEmergencyContactsByRegion = asyncHandler(async (req, res) => {
    const { region } = req.params;
    if (!region) {
        throw new ApiError(400, "Region parameter is required.");
    }

    const contacts = await EmergencyContact.find({
        regions: { $in: [region.toLowerCase(), 'global'] } 
    }).sort({ category: 1 }); 

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            contacts, 
            "Emergency contacts retrieved successfully."
        ));
});

const updateEmergencyContact = asyncHandler(async (req, res) => {
    if (!io) {
        console.error("Socket.IO instance not available in emergencyContactController!");
    }
    const { id } = req.params;
    const { organization, phoneNumber, category, regions } = req.body;

    const contact = await EmergencyContact.findById(id);
    if (!contact) {
        throw new ApiError(404, "Emergency contact not found.");
    }

    if (organization !== undefined) contact.organization = organization;
    if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber;
    if (category !== undefined) contact.category = category.toLowerCase();
    if (regions !== undefined) contact.regions = regions.map(r => r.toLowerCase());

    contact.updatedBy = req.user._id;

    const updatedContact = await contact.save();

    if (io) {
        for (const region of updatedContact.regions) {
            io.to(region).emit('emergency_contact_updated_in_region', updatedContact);
        }
        io.emit('global_emergency_contact_feed_update', updatedContact);
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            updatedContact, 
            "Emergency contact updated successfully."
        ));
});

const deleteEmergencyContact = asyncHandler(async (req, res) => {
    if (!io) {
        console.error("Socket.IO instance not available in emergencyContactController!");
    }
    const { id } = req.params;

    const contact = await EmergencyContact.findByIdAndDelete(id);

    if (!contact) {
        throw new ApiError(404, "Emergency contact not found.");
    }

    
    if (io) {
        for (const region of contact.regions) {
            io.to(region).emit('emergency_contact_deleted_in_region', { contactId: contact._id, region });
        }
        io.emit('global_emergency_contact_feed_update', { contactId: contact._id, action: 'deleted' });
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {}, 
            "Emergency contact deleted successfully."
        ));
});

export {
    createEmergencyContact,
    getEmergencyContactsByRegion,
    updateEmergencyContact,
    deleteEmergencyContact,
};