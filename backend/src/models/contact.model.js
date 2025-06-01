import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
    {
        contact: {
            type: String,
            required: true
        },
        region: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name : {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Contact = mongoose.model('Contact',contactSchema);