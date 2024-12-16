import multer from "multer";

//multer ek middleware ki jiasa kaam karta hai ismai hum jo bhi file aayega usko diskstorage mai save karwaigai ismai pahele destination dena padta hai ki kaha hum file store karegai to hum ec public->temp->gitkeep 
//karkai file banaye hai wahi hamara local storage hai pahle multer kai thruough wahi store hoga aur ye humko us file ka file.orignalname return 
//karega jo ki hum log cloudinary mai as a localFilePath vejegai aur phir wo waha se cloudinary kai server mai upload ho jayega
const storage= multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload =multer({
    storage,
})