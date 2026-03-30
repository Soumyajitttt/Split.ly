import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";


const app= express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,  
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

//routes
import userRoutes from "./routes/user.routes.js";


app.use("/api/v1.0.0/users", userRoutes);


export default app;