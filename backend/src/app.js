import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setSocketInstance as setAlertSocket } from "./controllers/alert.controller.js";
import { setSocketInstance as setShelterSocket } from "./controllers/shelter.controller.js";
import { setSocketInstance as setEmergencyContactSocket } from "./controllers/Emergencycontact.controller.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({extended: true, limit: "50mb"}))
app.use(cookieParser())
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on('join_region_room', (region) => {
        if (region) {
            const lowercasedRegion = region.toLowerCase();
            socket.join(lowercasedRegion);
            console.log(`Socket ${socket.id} joined room: ${lowercasedRegion}`);
        }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

setAlertSocket(io);
setShelterSocket(io);
setEmergencyContactSocket(io);


import userRouter from "./routes/user.route.js"
import alertRouter from "./routes/alert.route.js"
import shelterRouter from "./routes/shelter.route.js"
import emergencyContactRouter from "./routes/Emergencycontacts.route.js"
import pastwarsRouter from "./routes/pastWars.route.js"

app.use("/api/v2/users", userRouter) 
app.use("/api/v2/alerts", alertRouter)
app.use("/api/v2/shelters",shelterRouter)
app.use("/api/v2/contacts",emergencyContactRouter)
app.use("/api/v2/pastwars",pastwarsRouter)


export { app,server,io };
