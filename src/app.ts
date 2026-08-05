import express from "express";
import dotenv from "dotenv";
import { orderRoutes } from "./routes/order.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { bulkRoutes } from "./routes/bulk.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/orders/bulk", bulkRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Hello Node")
})

export default app;