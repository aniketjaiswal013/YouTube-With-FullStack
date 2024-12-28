import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,res,next)=>{
   try {
     // hum app.js mai app.use(cookieParser()); ye middleware use kiyai hai to ye req mai cookies ka access de dega jab bhi hum middleware add kartai hai to wah req mai uska access de deta hai use kai karan hum cookies ka access through req kar pp rahe hai
     const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
     if(!token){
         throw new ApiError(401,"unauthorize request")
     }
     //ager token sahi se aa gaya to ab hum log user.model.js mai accessToken mai access token kai saath bahut sara info veje thai jase ( _id:this._id, email:this.email,username:this.username, fullName:this.fullName) to usko phir se lene kai liyai jwt kai through verify karwaigai jo token aaya hai usmai sa info hai but usko wahi le sakta hai jiskai pass ACCESS_TOKEN_SECRET ho matlab jiskai pass lock ka key ho
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
     throw new ApiError(401,"Invalid accessToken")
    }   
 //user ab req mai add ho gaya 
    req.user=user;
 // is next ka matlab hota hai middleware ka kaam ho gaya ab aage ka kaam kijeye jo uskai baad likha hai
    next();
   } catch (error) {
    throw new ApiError(401,error?.message||"Invalid accessToken")
   }
       
})