import mongoose from 'mongoose';
import http from 'http';
import connectDB from './config/db.js';
import app from './app.js';
import dotenv from 'dotenv';
import { initSocket } from './socket/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Wrap the Express app in a plain HTTP server so socket.io can share the same port.
const server = http.createServer(app);
initSocket(server);

connectDB()
.then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to connect to the database:', error);
});