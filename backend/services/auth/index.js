import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./configs/db.js";
import dns from 'dns'
import authRouter from "./routes/auth.route.js";
dotenv.config();


const app = express();

app.use(express.json());

app.use(cookieParser());

const PORT = process.env.PORT || 6001

app.use((req, res, next) => {
  console.log(`[AUTH INCOMING] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/", authRouter);

app.use("/",authRouter);



app.listen(PORT,() => {
    console.log( `Auth Service Started on ${PORT}`);
    connectDb()
  }
);