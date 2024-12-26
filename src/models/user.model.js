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
        type:String //  cloudinary url
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
// userSchema.pre("save", async function (next){
//    if(!this.isModified("password"))return next(); // ye line ka matlab hum ager userschema kai kisi bhi field ko change karegai to bar bar password encypt hoga kyuki 'pre' middleware hai isyai hum chatai hai ki jab password mai koi modification ho tabhi encrypt ho

//    this.password= await bcrypt.hash(this.password,10)
//    next(); //'next' isliyai hai kyu ki jaise hi middlewarre chal gaya to baki ka kam karne kai liyai next ko call kar do
// })
userSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next(); 
   this.password = await bcrypt.hash(this.password, 10); // Hashing password
   next();
});
 
//hum password ko comapre karne cha rahe hai ki wo sahi hai ya nahi
userSchema.methods.isPasswordCorrect=async function(password) {
   console.log(password);
   console.log(this.password);
   
   
      return await bcrypt.compare(password,this.password); // password->jo user check ye login kai liyai bhejega this.password->jo ki encrypted and save hai database mai
}

// user ka acess and refresh token banegai matlab user ka signin seccession kab end hoga and kab refresh ho jayega

//work of AccessToken and RefreshToken 
// AccessToken and RefreshToken hum isliya generate karegai ki user kko baar baar login na karna pade username ya email daal kai hum access and refresh token generate kar kai user kai cookies mai vej degai and DB mai refresh token save kar degai access token short lived hota hai to ager wo 10 hour mai ager expire kar jata hai to hum 404 ka error generate karwaigai and jase hi fronted developer 
// 404 error dekhega to wo aesa code likhega ki user ek end point hit karega and apena refersh token vejga jesko hum DB mai store refresh token kai sath match karwaigai ager math karta hai to AccessToken and RefreshToken  ko phir se refresh kar degai and user bina username ya email diyai login ho jayega


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
         expiresIn:process.env.ACCESS_TOKEN_EXPIRY
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
         expiresIn:process.env.REFRESH_TOKEN_EXPIRY
      }
   )
}

export const User=mongoose.model("User",userSchema);