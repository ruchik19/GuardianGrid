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
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        region: {
            type: String,
            lowercase: true,
            required: true,
            trim: true
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        occupancy: { 
            type: Number,
            default: 0,
            min: 0,
        },
        isAvailable: { 
            type: Boolean,
            default: true, 
        },
        shelterType: {
            type: String,
            required: true,
            enum: ['community_hall', 'school', 'tent_camp', 'religious_place','bunker','other'],
            lowercase: true,
        },
        shelterfor: {
            type: String,
            enum: ["war", "calamity", "both"],
            default: "calamity"
        },
        calamityTypes: [
            {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
            },
        ],
        contactInfo: {
            type: String,
            trim: true,
        },
        militaryOnly: {
            type: Boolean,
            default: false
        },
        hasMedicalSupport: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

shelterSchema.pre('save', function(next) {
    this.isAvailable = this.occupancy < this.capacity;
    next();
});

shelterSchema.index({ location: "2dsphere" });

export const Shelter = mongoose.model('Shelter', shelterSchema);