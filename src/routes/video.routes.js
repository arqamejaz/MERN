import {Router} from "express";
import {
    publishAVideo,
    getAllVideos
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/").get(getAllVideos)
router.route("/upload-video").post(
    verifyJWT,
    upload.fields([
        { 
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
);



export default router