//contact model

import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
    {
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        organisation : {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: ['Police', 'Ambulance', 'Fire', 'Disaster Relief', 'Other'],
            lowercase: true,
        },
        regions: [
            {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
            },
        ],
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true
    }
)

export const EmergencyContact = mongoose.model('Contact',contactSchema);