import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "..//utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens=async(userId)=>{
  console.log(userId);
  
  try {
      const user=await User.findById(userId);
      console.log(user);
          const accessToken= user.generateAccessToken();
          // console.log(user);
          
         const refreshToken= user.generateRefreshToken();

         //database mai refresh token ko save karwane liya iska {validateBeforeSave:false} matlab kai save karne se pahelai wah password check magaiga isliyai {validateBeforeSave:false} se wah nahi bena password check kai save ho jayega
         user.refreshToken=refreshToken;
         await user.save({validateBeforeSave:false});

         return {accessToken,refreshToken};


  } catch (error) {
    throw new ApiError(500,"something went wrong while generating Access token and refresh token");
  }
}




 // asyncHandler ka use web requests to handle karne kai liyai kiya jata hai 
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
    /*console.log(req.body);
    [Object: null prototype] {
        fullName: 'pankaj Jaiswal',
        email: 'pani@123456',
        password: '123458',
        username: 'pnk123456'
      }
    */
    
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
   const existedUser= User.findOne({
    $or:[{username},{email}]
   });
   if(!existedUser){
    throw new ApiError(409,"user with username and email already exists ");
   }

   //4.router mai jo hum middleware add kiyai hai wo req mai aur fiels ka access provide karta hai waha se hum avatar ka path ya url le legai ye multer abhi server mai hi upload kiya hai cloudinary mai nahi
    //avatar[0]-> avatar ka first property multer mai check karegai to waha ek callback haijo ko local sever mai upload kar path provide karta hai
  
   // console.log(req.files);// ismai kya hota hai 
 /*
  [Object: null prototype] {
    avatar: [
      {
        fieldname: 'avatar',
        originalname: 'ram1.jpeg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './public/temp',
        filename: 'ram1.jpeg',
        path: 'public\\temp\\ram1.jpeg',
        size: 9344
      }
    ],
    coverImage: [
      {
        fieldname: 'coverImage',
        originalname: 'ram2.jpeg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './public/temp',
        filename: 'ram2.jpeg',
        path: 'public\\temp\\ram2.jpeg',
        size: 14081
      }
    ]
  }

  */
   
    const avatarLocalPath=req.files?.avatar[0]?.path;
//    const coverImageLocalPath=req.files?.coverImage[0]?.path;
//uper wala line isliyai nahi likahi gai kyu ki agar cover image aaya hi nahi to hum kaise uska 0th property check kar saktai hai so humko pahelai check karna hoga ki coverimage aaya hai ki nahi
   let coverImageLocalPath;
if(req.files &&Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path;
}
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required ram");
   }
 
   //5.ye kya karega ki ye jo avatar ka jo server mai url tha wo ab cloudinary mai upload karega jo hum log define kiyai hai function cloudinary.js mai aur avatar chuki required feild hai isliayi usko ek baar phir se check kar laigai ki nahi to database hi fat jayega
    const avatar= await uploadOnCloudinary(avatarLocalPath);
    //cloudinary ko ager coverImage nahi milai to wo empty string return kar deta hai
     const coverImage=await uploadOnCloudinary(coverImageLocalPath);
     if(!avatar){
        throw new ApiError(400,"Avatar file is required hai");
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
        new ApiResponse(201,createdUser,"User register successfully")
    )

});

const loginUser=asyncHandler(async(req,res)=>{
      /* steps to login
      1-> req.body se data uthana hai jo ki user login kartai samay vejega
      2-> Ab user 2 tarah se login kar sakta hai uasername or email to hum yaha dono kai through baegai
      3-> check karegai ki user exist karta hai ki nahi
      4->ager user mil jata hai to password check karwayegai
      5-> ager password match kar jata hai to access token and refresh token dono generate kar kai user ko vejegai
      6-> ye access token and refresh token ko user ko hum cookies mai vejetai hai 
      7-> send respose ki user login ho gaya hai
      */
    
      const {username,email,password}=req.body

       if(!username && !email){
        throw new ApiError(400,"username or email is required");
       }

      const user=await User.findOne({
                     $or:[{username},{email}]
                         });
       if(!user){
        throw new ApiError(404,"user does not exist");
       }
       console.log(user);
       
      //  console.log(passsword);
       
       const isPasswordValid=await user.isPasswordCorrect(password);
       console.log(isPasswordValid);
       
       if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect h");
       }

       const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

       // AccessAndRefreshTokens generate to ho gaya par uper wala user kai pass refreshToken ka access nahi isyai DB ko call kar kai phir se user ka access lene hoga 
            const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
       //cookies(small text files that websites send to your browser to remember information about your visit) send karne kai liyai ye jo httpOnly:true hai ye ensure karta hai ki on sever can modify your cookies
       const option={
        httpOnly:true,
        secure:true
       }

       res.status(200)
       .cookie("accessToken",accessToken,option)
       .cookie("refreshToken",refreshToken,option)
       .json(
         new ApiResponse(
          200,
          {
              user:loggedInUser,accessToken,refreshToken
          },
          "user logged In successfully"
         )
       )

});

const logoutUser=asyncHandler(async(req,res)=>{
  // to user ko loggedout karne kai uska cookies clear karna hoga and uskai refreshToken ko reset karna hoga 
  // problem-> cookies clear karnai  and uskai refreshToken ko reset karnai kai liyai humko user ka access karna hoga but wo logout kai liyai kuch vejega to nahi isliyai humare req.body mai us user ka access bhi nahi hoga 
  // solution-> authintication ka middleware hai(auth.middleware.js) hum ex middleware design karegai logout kai just pahelai call hoga and us middle ware ka kaam hoga ki req mai user ko add kar do req ex object hi to hai to uskai user new property add kar degai 
  // middleware->iska kaam hota hai aage jane se pahele humse mil kai jana
  await User.findByIdAndUpdate(
        req.user._id,
        {
          $set:{
            refreshToken:undefined
          }
        },
          {
            //new:true se  response  mai jo value return hoga usmai  refreshToken:undefined hoga
            new:true
          }
        
     )

     //cookies remove hoga yaha se
     const option={
      httpOnly:true,
      secure:true
     }
     res.status(200)
     .clearCookie("accessToken",option)
     .clearCookie("refreshToken",option)
     .json(new ApiResponse(200,{},"user logged out"));
});

const refreshAccessToken=asyncHandler(async(req,res)=>{

  //ye refresh token hum user kai pass se uthaigai uskai cookie ko access kar kai
  const incomingRefreshToken=req.cookie?.refreshToken||req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized refresh token");
    
  }
  //cookie mai jo refresh token hota hai and uska key hai process.env.REFRESH_TOKEN_SECRET and is key ki madad se hum token ko decode kar kai user kai id,email,usename,fullName ko access kar saktai hai kyu user.model.js mai refresh token generate kartai samay hum ye sab store karwai thai aur ye sab access hum key se decode kar kai kar saktai hai
try {
  
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user=await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invalid refresh token");
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(404,"refresh token is expierd or used")
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user?._id);
    const option={
      httpOnly:true,
      secure:true
     }
     res.status(200)
     .cookie("accessToken",accessToken,option)
     .cookie("refreshToken",newRefreshToken,option)
     .json(
      new ApiResponse(200,
        {
         accessToken,refreshToken:newRefreshToken
        }
        ,
        "Access Token refreshed"
      ));
} catch (error) {
    throw new ApiError(401,error?.message||"invalid refresh token")
}

});

const changeCurrentPassword=asyncHandler(async(req,res)=>{

     const {oldPassword,newPassword}=req.body
     // ager user conformPassword bhi vejta hai to bas ek check lagana padega
    //  if(newPassword!==conformPassword){
    //   throw new ApiError(400,"newPassword and conformPassword are not same");
    //  }

     //user apna password change kar paa raha matlab wo login hai ar ager wo login hai to verifyJWT wala middleware run hua hai jisk kaam hai req mai user ko inject kar dena ab hum waha se user ko find out kar payegai
     const user=await User.findById(req.user?._id);
     const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
     if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old password");
     }
     user.password=newPassword;
    await user.save({validateBeforeSave:false});
   return res.status(200)
    .json(
      new ApiResponse(200,{},"Password changed Sucessfully")
    )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  // user ager logged in hai to usko user dena koi badi baat nahi hi kyu ki verifyJWT to user ko req mai inject kar diya hai 
  return res.status(200).json(new ApiResponse(200,req.user,"current user fatched successfully"))

});

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName || !email){
    throw new ApiError(400,"All feilds are required");
  }
      const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set:{
               fullName:fullName,
               email:email
           }
        },
        {
          //new ko true karne ka matlab hai ki jo bhi value update hua hai upadate hane kai baad user ka jo updated details hai wo return ho jayega
          new:true
        }
       ).select("-password");

       return res
       .status(200)
       .json(new ApiResponse(200,user,"Account details updated successfully"));
});

const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing");
  }
 const avatar=await uploadOnCloudinary(avatarLocalPath);
 if(!avatar.url){
  throw new ApiError(400,"Error while uploading on cloudinary");
 }

    const user =await User.findByIdAndUpdate(
      //user chuki login hai isliyai hum avatar ko update kar pa rahe hai isliyai hum aur user login hai matlab verifyJWT chala hai aur wo user ko inject kar diya hai req mai
         req.user?._id,
         {
            $set:{
              avatar:avatar.url
            }
         },
         {
          new:true
         }
    ).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200,user,"Avatar updated successfully")
    );
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400,"Avatar file is missing");
  }
 const coverImage=await uploadOnCloudinary(coverImageLocalPath);
 if(!coverImage.url){
  throw new ApiError(400,"Error while uploading on cloudinary");
 }

    const user =await User.findByIdAndUpdate(
      //user chuki login hai isliyai hum avatar ko update kar pa rahe hai isliyai hum aur user login hai matlab verifyJWT chala hai aur wo user ko inject kar diya hai req mai
         req.user?._id,
         {
            $set:{
              coverImage:coverImage.url
            }
         },
         {
          new:true
         }
    ).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200,user,"Cover Image updated successfully")
    );
})



//mongoDB mai jaise haumko subscriber and channel ko nikalna hai to jaise user- a,b,c,d chanel- CAC,HCC,FCC to jab bhi koi user kisi channel ko subscribe karta hai mongoDB mai ek object banta hai {channel-CAC,subscriber-a} ,{channel-CAC,subscriber-b}{channel-CAC,subscriber-c},{channel-HCC,subscriber-c},{channel-FCC,subscriber-c} to ek channel ka multiple subscriber ho sakta hai and ek subscriber multi channel ko subscribe kar sakta hai to 
//NB:- ager humko subscriber find out karna hai to humko channel ko count karegai jase CAC ka kithana subscriber hai to count this {channel-CAC,subscriber-a} ,{channel-CAC,subscriber-b}{channel-CAC,subscriber-c}
//NB:- ager humko  find out karna hai wo kitha channel ko subscribe kiya hai  to us id wala kitana channel ko subscribe kiya hai wo find out karna hoga  ager pata karna hai ki c kisko kisko subscribe kiya hai to count this  {channel-CAC,subscriber-c},{channel-HCC,subscriber-c},{channel-FCC,subscriber-c}

// Aggregation Pipelines:- koi DB mai ager data store hai aur us data kai uper hum koi operation perform karwana cha rahe hai jaise humko iss id ka student de do ya left join karwa do is student id ka total kitna student hai ye find out karna hai to ye humko way provide karta hai is hum pipeline ko ek kai baad ek stage kar kai likhaigai aur har stage ka jo input hai wah privious stage ka output se aaye hoga jase humko koi particular student id ka data ko aage wala stage mai pass kar deyai ab us particular student id wata student mai hum kuch operation perform karwaigai
//for more info on Aggregation Pipelines visit this(https://www.mongodb.com/resources/products/capabilities/aggregation-pipeline)

const getUserChannelProfile=asyncHandler(async(req,res)=>{
  //user profile mai return karegai user ka (username,email,fullName, avater,coverImage,subscriber,subscribedTo,)
  //subscriber,subscribedTo ko find out karne kai liyai Aggregation Pipelines lagana padega
  
  
  // user ek end point hit karega matlab ek url mai jaiga to us url se hum username nikalegai isliyai req.params
 const {username}=req.params

 if(!username?.trim()){
  throw new ApiError(400,"username is missing");
 }

   // to ab humko usename milgaya hai ab hum usmai Aggregation Pipelines laga kar subscriber,subscribedTo find out kar saktai hai 
  const channel= await User.aggregate([
       {
        //ye match pipe line ka kaam hai ki jo bhi users hai User database mai usmai se hum username(jo ki humko url se mila hai) usko return karega aur usko hum aage pass kar degai ye one sing user hi return karega jo ki uss username ko match karta ho 
        $match:{
          username:username?.toLowerCase()
        }
       },
       {
        // lookup ka kaam hai ki jase mere pass do table hai ek User and ek subscription to user mai jo username hai usko kitna jan subscribe kiya hai wo nikalana chatai hai to uss username ka subscription table mai kitna channel hai ager ye pata chal jaye to hum usko count kar legai aur humko subscriber mil jayega to lookup ek join ki tarah kaam karega username ko jake subscription table kai channel mai ja kai khojega 
        $lookup:{
          // abhi hum User mai hai aur from matlab kaha se join karna hai matlab humko subscriptions table se join ksrna hai 
          from:"subscriptions", //chuki DB mai name ase hi save hota hai
          localField:"_id",  //matlab hamare pass jo usename hai uska id aur wahi id subscription table kai channel mai hoga tabhi to wo channel ko koi subscribe kiya hoga (NB- channel bhi ek user hi hai )
          foreignField:"channel", //iss channel mai uss username ka id hai jo ki url se aaye hai 
          as:"subscribers" // to ye ek feild/attribute ban jaye ga jisme subscriptions table ka wo wo elment hoga jiska channel mai jo id hai wo username kai id se match karta ho
        }

       }
       ,
       {
        // hum ismai findout kar rehe hai ki humko kitne jan ne subscribe kiya hai 
          $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber", // subscriptions table kai  subscriber feild mai jo id hai uska matlab hai ki subscriber feild ka wo id us channle ko subscribe kiya hai jo us element mai hai to kitna mai url kai username wala id subscriber mai kitnibaar aaye hai wo nikal le to kaam ho jayega
            as:"subscribedTo"
          }
       },
       {
        // User model ka jo sechema hai usmai feild/attribute add kar deta hai to usmai hum subscriber and subscribedTo two feild add karwaigai
        $addFields:{
             subscribersCount:{
              $size:"$subscriber" //subscriber kai pahle $ isliyai laga hai kyu ki wo feild ban gaya hai aur uskai ander wo wo ele hoga jiska channel mai jo id hai wo username kai id se match karta ho ab usko $size ki maddad se count kar legai wahi uska subscriber hoga 
             },
             channelSubscribedToCount:{
              $size:"$subscribedTo"
             },
             isSubscribed:{
              // iss feild mai ye check hoga ki ager hum kisika profile check kar rehai hai to ager hum usko subscribe kar deyai hai to true assign hoga isSubscribed mai nahi to false  to isko check kai liyai
                $cond:{
                  if:{$in:[req.user?._id,"$subscribers.subscriber"]}, // chuki user login hai tabhi dusra ka profile check kar paa raha hai to hum user ka id ko subscribers ka jo object return hua hai usmai check kare gai uskai subscriber arrtibute mai ager mil gaya matlab hum jo profile check kar raha hai usne jisko profile check kar raha hai uako subscribe kiya hai 
                  then:true,
                  else:false
                }
             }
        }
       },
       {
        //project ka kaam hai ki kon sa feild ko vejna hai uani return karna hai 
        $project:{
          fullName:1,
          username:1,
          subscribersCount:1,
          channelSubscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1
        }
       }
   ]);

   // ek baar channel ko console.log karwana hai
   if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"user channel fatched successfully")
   )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}