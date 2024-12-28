import mongoose ,{Schema} from "mongoose";

const subscriptionSchema=new Schema(
    {
     //id jo hai wo medel creation kai samay auto maitic generate ho jata hai
     subscriber:{
        typeof:Schema.Types.ObjectId,     // ismai uss user ka id store hoga jo niche wala channel ko subscribe kiya hai
        ref:"User"
     },
     channel:{
         typeof:Schema.Types.ObjectId,   // ye wah hai jisko koi user subscribe karega matlab user jo hai wo user ko hi subscribe karega
        ref:"User"
     }
   },
   {
    timestamps:true
   }


);


export const Subscription=mongoose.model("Subscription",subscriptionSchema)