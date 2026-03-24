import express from 'express';
import cors from 'cors';

app.use(cors({
    origin: process.env.CORS_ORIGIN,  
    credentials: true
}));

const app = express();

export default app;