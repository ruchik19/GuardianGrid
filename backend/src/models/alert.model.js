import mongoose, { Schema } from "mongoose";

const alertSchema = new Schema(
    {
        region: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message : {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Alert = mongoose.model('Alert', alertSchema);