import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app=express();

// ye jitna bhi app.use hai as a middleware kam karta hai hamerai server aur fronted kai bich ki kisko kisoko allow karo ki server crase na kar jaye
app.use(cors({
    origin:process.env.CORS_ORIGIN, //cors ka kam hai ki kisko frontend server ko allow karna ki wo hamra backened se baat kar paye nahi to koi bhi baat kar lega ye security purpose kai liyai hai
    Credentials:true
}))
app.use(express.json({limit:"16kb"})); // ager koi data fronted se json formate mai aaraha hai to umai hum limit lagayegai ki ithna hi size hona chahiye nahi to server hi crase ho jayega
app.use(express.urlencoded({extended:true,limit:"16kb"})); // URL except karne kai liye
app.use(express.static("public")); // jaise koi file folder ya image aaya to usko pblic folder mai store karne kai liye
app.use(cookieParser()); //cookie ek prakar se browsing history hi ho gaya jo ki web app apkai mobile ko ye small text file kai rup mai send karta hai aur ye app.use mai isliyai set kiyaai kyuki hamara server user kai cookie ko set and access kar paye
export {app};