import {Router} from "express";
import { loginUser,logoutUser,registerUser,refreshAccessToken } from "../controllers/user.controller.js";
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

export default router;