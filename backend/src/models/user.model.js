
import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            index: true,
            lowercase: true,
            validate : [validator.isEmail, "Provide a valid email"],
            unique: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        region: {
            type: String,
            lowercase: true,
            required: [true, "Your region is required"],
            trim: true,
            index: true
        },
        role: {
            type: String,
            enum: ["armyofficial","civilian"],
            required: true,
        },
        location: {
            type: new mongoose.Schema({ 
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point',
                    required: true 
                },
                coordinates: {
                    type: [Number],
                    index: '2dsphere', 
                    required: true 
                }
            }),
            required: false
        },
        contact: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
    
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            region: this.region

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.index({location:'2dsphere'})
export const User = mongoose.model("User",userSchema)