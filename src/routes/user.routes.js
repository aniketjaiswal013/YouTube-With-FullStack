import {Router} from "express";
import { loginUser,
         logoutUser,
         registerUser,
         refreshAccessToken,
         changeCurrentPassword,
         getCurrentUser, 
         updateAccountDetails,
         updateUserAvatar,
            updateUserCoverImage, 
            getUserChannelProfile,
            getWatchHistory
        } 
        from "../controllers/user.controller.js";


        
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
const router=Router();
//yaha par app.js se request aaya hai ab ager ye http://localhost:8000/api/v1/users/register  route mai hum request kiye to ye route post request ko execute karwa dega 
router.route("/register").post(
    //ye upload ek middelware hai jo ki run karega registerUser kai pahele aur iska kaam hai ki jo fronted se coverImage ya png ya koi file aayega to usko multer kai through local disk mai upload karna phir waha se wo file cloudinary mai upload hoga aur ye middlewware ki wajah se hi hum req.files ka access mila hai kyuki ye middleware req mai files ka access de deta hai
    upload.fields([
       {
          name:"avatar",
          maxCount:1
       },
       {
        name:"coverImage",
        maxCount:1
       }
    ]),
    registerUser
);
router.route("/login").post(loginUser);
//ye jo verifyJWT hai wo middleware hai jo ki auth.middleware.js mai define hai jiska kaam hai user ko req mai add kar do
router.route("/logout").post(verifyJWT,logoutUser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
// chuki logged in user hi password change kar paayega isliyai verifyJWT
router.route("/current-user").get(verifyJWT,getCurrentUser);


//yaha patch hoga kyuki post karne se sab attribute ka details hi update ho jayega but hum kuch particular details update karwana cha rahe hai
router.route("/update-account").patch(verifyJWT,updateAccountDetails);

// ye upload.single("avatar") middleware hai jo ki hame server mai avtar ko upload karega jo ki fronted se aaya hai aur patch iss liyai kyuki only avatar update karwana hai pura user hi upadate nhai karwana
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);


// ye jo /c/:username hai usmai ':' kai baad jo bhi hum username likhaigai wahi humko req.params kai destructure kiyai hua username mai milaiga 
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getWatchHistory)



export default router;