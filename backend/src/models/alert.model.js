
import mongoose, { Schema } from "mongoose";

const alertSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 100,
        },
        type: {
            type: String,
            enum: ['war', 'calamity','drill','other'],
            required: true,
            lowercase: true,
        },
        message : {
            type: String,
            trim: true,
            required: true
        },
        severity: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            lowercase: true,
        },
        targetRegions: [
            {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true
    }
)

export const Alert = mongoose.model('Alert', alertSchema);