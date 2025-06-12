import dotenv from "dotenv";
import { server } from "./app.js";

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()

.then(()=>{
    server.listen(process.env.PORT || 7000, () => {
        console.log(`server is running at port: ${process.env.PORT}`);

    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!",err);
})