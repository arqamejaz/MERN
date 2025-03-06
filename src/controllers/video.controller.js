import {Video} from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async(req, res) => {
    // Get data from req
    // Initialize aggregation array and filter object
    // Seacrh aggregation
    // Validate userId and update filter object
    // Sort
    // Get user details
    // return res
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pipeline = []
    const filters = { isPublished: true}

    if(query && query.trim() !== ""){
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query,
                    path: ["title", "description"]
                }
            }
        })
    }
    if(userId){
        if(!mongoose.Types.ObjectId.isValid(userId)){
            throw new ApiError(400, "Invalid userId")
        }
        filters.owner = mongoose.Types.ObjectId(userId)
    }
    pipeline.push({ $match: filters })
    
    const sortOptions = { createdAt: -1}
    if(sortBy && ["views", "createdAt", "duration"].includes(sortBy)){
        sortOptions[sortBy] = sortType === 'asc' ? 1 : -1
    }
    pipeline.push({ $sort: sortOptions})

    pipeline.push({
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [{ $project: { username: 1, "avatar.url": 1}}]
            }
        },
        { $unwind: "$userDetails" }
    )

    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10)}
    const videoAggregate = Video.aggregate(pipeline)
    const videos = await Video.aggregatePaginate(videoAggregate, options)

    if(!videos){
        throw new ApiError(404, "No video found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully!"))
})

const publishAVideo = asyncHandler(async(req, res) => {
    //  get user data from frontend
    //  validate data is not empty
    //  save videoLocalPath and thumbnail
    //  validate video exist in req
    //  upload to cloudinary
    //  create user object - create entry in db
    //  check entry is saved in db
    //  return res

    const { title, description } = req.body
    
    if(!title || !description){
        throw new ApiError(400, "Title and Description is required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required")
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    if(!videoFile){
        throw new ApiError(400, "Video file not found")
    }
    
    if(!thumbnail){
        throw new ApiError(400, "Thumbnail file not found")
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile?.duration,
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        isPublished: false,
        owner: req.user._id
    })

    const videoUploaded = await Video.findById(video._id)

    if(!videoUploaded){
        throw new ApiError(400, "Video upload failed")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"))
})

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params
})

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params

})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}