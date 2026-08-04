import express from "express";
import dotenv from "dotenv";
import { orderRoutes } from "./routes/order.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/v1/orders", orderRoutes);

app.get("/", (req, res) => {
    res.send("Hello Node")
})

export default app;