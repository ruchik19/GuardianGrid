import mongoose, { Schema } from "mongoose";

const shelterSchema = new Schema(
    {
        location: {
            type:{
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point'
            },
            coordinates:{
                type: [Number],
                required: true
            }
        },
        region: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        capacity: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['available','full'],
            default: 'available'
        }
    },
    {
        timestamps: true
    }
)

shelterSchema.index({ location: "2dsphere" });

export const Shelter = mongoose.model('Shelter', shelterSchema);