const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {errorMiddleware} = require('../midleware/error');
const authRouter = require('../routes/auth');
const corsOptions = require('../utils/corsOptions');
const userRouter = require("../routes/user");
const vehicleRouter = require("../routes/vehicle");
const customerRouter = require("../routes/customer");
const fuelStationRouter = require("../routes/fuelStation");

module.exports = (app) => {
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRouter);
    app.use("/api/user",userRouter);
    app.use("/api/vehicle", vehicleRouter);
    app.use("/api/customer", customerRouter);
    app.use("/api/fuelStation", fuelStationRouter);

    //error middleware
    app.use(errorMiddleware);
}