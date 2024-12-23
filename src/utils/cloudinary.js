import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
//cloudinary humko file upload karne ki service provide karta hai isme humlog ye stratigy use karegai ki hum pahle jo bhi file 
// web broweser kai through hum log kai pass ayega usko hum multer(jo ki ex middleware hai) uskai through apne local server mai upload karwaigai 
// and phir local sever se cloudinary mai upload karegai aisa isliyai kartai hai jab apne sever mai file aagaya to hum usko phir se reupload kar 
//  saktai hai ager need ho to aur ye production level practice hai
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary= async (localFilePath)=>{
   try {
        if(!localFilePath)return null;
        // upload the on cloudinary
       const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        });
        //file uploaded successfully on cloudinary
        // console.log("file uploded on cloudinary",response.url);
        //file cloudinary mai upload ho jane kai baad us file ko apne server se delete kar degai
        fs.unlinkSync(localFilePath);
        return response;
        
   } catch (error) {
        // ager file upload nahi hota hai to usko apne sever se us file ko delete karnaa hoga nahi to bahut sara file messup hoga to server se file delete nahi hota hum unlink kar detai hai
        fs.unlinkSync(localFilePath);
        return null;
    }
}
export {uploadOnCloudinary}
