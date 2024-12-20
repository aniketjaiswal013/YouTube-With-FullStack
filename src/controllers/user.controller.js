import { asyncHandler } from "../utils/asyncHandler.js";

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



});

export {registerUser}