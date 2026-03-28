import { loginUser, registerUser } from "../controllers/user.controller";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

//task routes

registerUser.post("/register", registerUser);
loginUserUser.post("/login", loginUser);