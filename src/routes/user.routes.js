import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
const router=Router();
//yaha par app.js se request aaya hai ab ager ye http://localhost:8000/api/v1/users/register  route mai hum request kiye to ye route post request ko execute karwa dega 
router.route("/register").post(registerUser);

export default router;