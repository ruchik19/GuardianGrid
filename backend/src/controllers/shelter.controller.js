import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { Shelter } from "../models/shelter.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

let io = null;
export const setSocketInstance = (socketInstance) => {
  io = socketInstance;
};

const addnewShelter = asyncHandler(async(req,res)=>{

    if (!io) {
        console.error("Socket.IO instance not available in shelterController!");
    }

    const {
        name,
        description,
        shelterType,
        calamityTypes,
        location, 
        capacity,
        occupancy, 
        militaryOnly,
        hasMedicalSupport,
        contactInfo,
        region,
        shelterfor
    } = req.body 

    if (!name || !location || !location.latitude || !location.longitude || !capacity || !region) {
        throw new ApiError(400, 'Name, location (latitude/longitude), capacity, and region are required.');
    }
    if (occupancy !== undefined && occupancy < 0) {
        throw new ApiError(400, 'Occupancy cannot be negative.');
    }
    if (occupancy !== undefined && occupancy > capacity) {
        throw new ApiError(400, 'Occupancy cannot exceed capacity.');
    }

    const shelter = await Shelter.create({
        name,
        description,
        shelterType: shelterType.toLowerCase(),
        calamityTypes: calamityTypes ? calamityTypes.map(c => c.toLowerCase()) : [], 
        location: {
            type: 'Point',
            coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
        },
        capacity,
        occupancy: occupancy || 0, 
        militaryOnly: militaryOnly || false,
        hasMedicalSupport: hasMedicalSupport || false,
        contactInfo,
        region: region.toLowerCase(), 
        updatedBy: req.user._id 
    });

    if (io) {
        io.to(shelter.region).emit("shelter_updated_in_region", shelter); 
        console.log(`Emitting 'shelter_updated_in_region' to room: ${shelter.region}`);
        io.emit("global_shelter_feed_update", shelter); 
    }

    return res
    .status(201)
    .json(new ApiResponse (
        201,
        shelter,
        "shelter added successfully !"
    ))

})

const updateShelter = asyncHandler(async(req,res)=> {

    if (!io) {
        console.error("Socket.IO instance not available in shelterController!");
    }
    
    const { id } = req.params;

    const {
        name,
        description,
        shelterType,
        calamityTypes,
        capacity,
        occupancy,
        militaryOnly,
        hasMedicalSupport,
        contactInfo,
    } = req.body;

    const shelter = await Shelter.findById(id);

    if (!shelter) {
        throw new ApiError(404, "Shelter not found.");
    }

    if (name !== undefined) shelter.name = name;
    if (description !== undefined) shelter.description = description;
    if (shelterType !== undefined) shelter.shelterType = shelterType.toLowerCase();
    if (calamityTypes !== undefined) shelter.calamityTypes = calamityTypes.map(c => c.toLowerCase());
    if (capacity !== undefined) shelter.capacity = capacity;
    if (occupancy !== undefined) {
        if (occupancy < 0) {
            throw new ApiError(400, 'Occupancy cannot be negative.');
        }
        if (occupancy > shelter.capacity) {
            throw new ApiError(400, 'Occupancy cannot exceed capacity.');
        }
        shelter.occupancy = occupancy;
    }
    if (militaryOnly !== undefined) shelter.militaryOnly = militaryOnly;
    if (hasMedicalSupport !== undefined) shelter.hasMedicalSupport = hasMedicalSupport;
    if (contactInfo !== undefined) shelter.contactInfo = contactInfo;

    shelter.updatedBy = req.user._id; 

    const updatedShelter = await shelter.save();

    if (io) {
        io.to(updatedShelter.region).emit("shelter_updated_in_region", updatedShelter);
        console.log(`Emitting 'shelter_updated_in_region' to room: ${updatedShelter.region}`);
        io.emit("global_shelter_feed_update", updatedShelter);
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        updatedShelter,
        "updated successfully"
    ))
})

const getSheltersByRegion = asyncHandler(async (req, res) => {
    const { region } = req.params;
    if (!region) {
        throw new ApiError(400, "Region parameter is required.");
    }

    const shelters = await Shelter.find({ region: region.toLowerCase() }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(
          200, 
          shelters, 
          "Shelters retrieved successfully"
        ));
});

const deleteShelter = asyncHandler(async (req, res) => {
    const { id } = req.params; 

    const shelter = await Shelter.findByIdAndDelete(id);

    if (!shelter) {
        throw new ApiError(404, "Shelter not found.");
    }

    if (io) {
        io.to(shelter.region).emit('shelter_deleted_in_region', { shelterId: shelter._id, region: shelter.region });
        io.emit('global_shelter_feed_update', { shelterId: shelter._id, action: 'deleted' });
    }

    return res
        .status(200)
        .json(new ApiResponse(
          200, 
          {}, 
          "Shelter deleted successfully"
        ));
});


export { addnewShelter, updateShelter,getSheltersByRegion,deleteShelter}
