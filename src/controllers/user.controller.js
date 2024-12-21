import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "..//utils/ApiResponse.js"
const registerUser=asyncHandler(async (req,res)=>{
         //step by step user ko register karwaye gai  
    //1.get user details from frontend
    //2.ye check karna hai ki koi impotant feild empty to nahi hai([validation check]->not empty)
    //3.check user already exist:for this yo have to check username,email
    //4.check for image,check for avatar
    //5.upload them to cloudinary,avatar ko check karo ki cloudinary mai upload hua ki nahi
    //6.create user object-create entry in DataBase matlab user create kar kai uska sab data dal kai usko DB mai dal do
    //7.remove password and refresh token feild from response (hum nahi chate ki user passsword ko dekh paye)
    //8.check for user creation
    //9.return response
    

    //1. ye jo req.body hai wo uski maddad se humko sab attriibutes ka access mil gaya ab sbko hum destructure kar diyai hai (jo data fronted ya postman mai jo post mai sen kartai hai wo sab req.body mai atta hai) req.body ka access humko express deta hai 
   const {fullName,username,email,password}= req.body
  
   //2. ye hum check kar rahe hai ki sab feild aa to raha hai ki nahi koi empty to nahi hai ye some() methode array kai sab ele ko check karega ki har particular feild ko trim(remove unwanted space) karne kai baad bhi ager wah empty hota hai to true return karega aur ye erroe throw karega 
   if(
       [fullName,username,email,password].some((feild)=>
           feild?.trim()===""
       )
   ){
    // ApiError ka hum pahele hi class bana liyai to humko baar baar pura error ka formate nahi likhna hoga
       throw new ApiError(400,"All feilds are required ");  
   }

   //3.ye jo User hai wah hum user.models se lai kai aaye hai wo db mai check kar sakta hai ki ye username ya email already exists karta hai ki nahi
   const existedUser=User.findOne({
    $or:[{username},{email}]
   });
   if(!existedUser){
    throw new ApiError(409,"user with username and email already exists ");
   }

   //4.router mai jo hum middleware add kiyai hai wo req mai aur fiels ka access provide karta hai waha se hum avatar ka path ya url le legai ye multer abhi server mai hi upload kiya hai cloudinary mai nahi
    //avatar[0]-> avatar ka first property multer mai check karegai to waha ek callback haijo ko local sever mai upload kar path provide karta hai
   const avatarLocalPath=req.fiels?.avatar[0]?.path;
   const coverImageLocalPath=req.fiels?.coverImage[0]?.path;
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required ");
   }
 
   //5.ye kya karega ki ye jo avatar ka jo ser mai url tha wo ab cloudinary mai upload karega jo hum log define kiyai hai function cloudinary.js mai aur avatar chuki required feild hai isliayi usko ek baar phir se check kar laigai ki nahi to database hi fat jayega
    const avatar= await uploadOnCloudinary(avatarLocalPath);
     const coverImage=await uploadOnCloudinary(coverImageLocalPath);
     if(!avatar){
        throw new ApiError(400,"Avatar file is required ");
     }
   
   //6.ye new user ko create kar kai uski entry DB mai karwa dega 
   const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
   });
   
   //7. ager user successfully DB mai 0ban gaya hai to db usmai apne se ek feild add karta hai _id to ab uski madad se hum dekhegai ki user bana hai ki nahi aur bana hai to select mathode se hum password and refersh token ko hata kar baki sab ko return kar degai
        const createdUser=await User.findById(user._id).select(
            "-password -refreshToken"
         );
   //8. check for user creation 
         if(!createdUser){
            // 500 error is server side error hai matlab client apna sab info sahi veja hai server ko upload karne ye fetch karne mai koi galti ho gaya hai
            throw new ApiError(500,"something wrong while registering the user  ");
         }
    
    //9. return the response in full formate
    return res.status(201).json(
        new ApiResponse(201,createdUser,"User register successfully");
    );

});

export {registerUser}