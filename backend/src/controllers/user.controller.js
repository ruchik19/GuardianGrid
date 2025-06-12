import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    console.log(req.body);
    const { name, email, password, region, role, contact, latitude, longitude } = req.body;
    console.log("email: ",email);
    if (
        [name,email,region,password,role,contact].some((fields) => fields?.trim()==="")
    ) {
        throw new ApiError(400, "all fields are required")
    }
    if (role === 'civilian' && (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude))) {
        throw new ApiError(400, "Latitude and longitude are required for civilian users.");
    }
    const existedUser = await User.findOne({ 
        $or: [{ email: email.toLowerCase() },{ contact }]
    }) ;       
    if (existedUser) {
        throw new ApiError(409, "User with email or contact already exists")
    }
    const userData = {
        name,
        email: email.toLowerCase(),
        password,
        region: region.toLowerCase(),
        contact,
        role: role.toLowerCase(),
    };
   
        userData.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    
    const user = await User.create(userData);
    const createdUser = await User.findById(user._id).select(     
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) =>{

    const {email, contact , password} = req.body
    console.log(email);

    if (!contact && !email) {
        throw new ApiError(400, "contact or email is required")
    }

    const user = await User.findOne({
        $or: [{contact}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")      
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {name, region, contact, latitude, longitude} = req.body

    if (!name && !region && !contact && (latitude === undefined || longitude === undefined)) {
        throw new ApiError(400, "At least one field (name, region, contact, or location) is required for update.");
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (region) updateFields.region = region.toLowerCase();
    if (contact) updateFields.contact = contact;
    if (latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)) {
        updateFields.location = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    } else if (latitude !== undefined || longitude !== undefined) {
         throw new ApiError(400, "Both latitude and longitude are required for location update.");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateFields },
        { new: true, runValidators: true } 
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

export {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
}
