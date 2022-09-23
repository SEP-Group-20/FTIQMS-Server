const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {errorMiddleware} = require('../midleware/error');
const authRouter = require('../routes/auth');
const corsOptions = require('../utils/corsOptions');
const userRouter = require("../routes/user");

module.exports = (app) => {
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRouter);
    app.use("/api/user",userRouter);


    //error middleware
    app.use(errorMiddleware);
}