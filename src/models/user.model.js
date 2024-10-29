import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"; // iska use hum password ko encrypt and decrypt karne kai liyai kartai hai
import jwt from "jsonwebtoken";

const userSchema=new Schema(
    {
     username:{
        type:String,
        required:true,
        unique:true,
        trim:true, // it removes the unrequired spaces in the word
        lowercase:true,
        index:true  // it uses for secrching purpose search karne mai bahut optimise baneyega but complexity become more
     } ,
     email:{
        type:String,
        required:true,
        unique:true,
        trim:true, // it removes the unrequired spaces in the word
        lowercase:true,
     },
     fullName:{
        type:String,
        required:true,
        trim:true, // it removes the unrequired spaces in the word
        index:true
     },
     avatar:{
        type:String, //  cloudinary url  matlab hum photo ko kahi aur store karwai gai aur wo uska url de dega jikai madad se hum usko access kar payegai
        required:true,
     },
     coverImage:{
        type:string //  cloudinary url
     },
     watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
     ]
     ,
     password:{
        type:String,
        required:[true,'password is required']
     },
     refreshToken:{
        type:String
     }
    },
    {
        timestamps:true
    }
)

//ye middleware hai iss middleware mai hi pre hook hai jiska kam hai ki ismai jaise hum save event likahia hai ki password save hane se just pahelai uako encrpt kar kai save kar do    
userSchema.pre("save", async function (next){
   if(!this.isModified("password"))return next(); // ye line ka matlab hum ager userschema kai kisi bhi field ko change karegai to bar bar password encypt hoga kyuki 'pre' middleware hai isyai hum chatai hai ki jab password mai koi modification ho tabhi encrypt ho

   this.password=bcrypt.hash("password",10);
   next(); //'next' isliyai hai kyu ki jaise hi middlewarre chal gaya to baki ka kam karne kai liyai next ko call kar do
})
 
//hum password ko comapre karne cha rahe hai ki wo sahi hai ya nahi
userSchema.methods.isCorrectPassword=async function(password) {
      return await bcrypt.compare(password,this.password); // password->jo user check ye login kai liyai bhejega this.password->jo ki encrypted and save hai database mai
}

// user ka acess and refresh token banegai matlab user ka signin seccession kab end hoga and kab refresh ho jayega
userSchema.methods.generateAccessToken=function (){
   return jwt.sign(
      {
         _id:this._id,
         email:this.email,
         username:this.username,
         fullName:this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn:ACCESS_TOKEN_EXPIRY
      }
   )
}

userSchema.methods.generateRefreshToken=function (){
   return jwt.sign(
      {
         _id:this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn:REFRESH_TOKEN_EXPIRY
      }
   )
}

export const User=mongoose.model("User",userSchema);