import { Router } from "express";
import { cancelOrderHandler, createOrderhandler, trackOrderHandler } from "../controllers/order.controller.js";

export const orderRoutes = Router();

orderRoutes.post("/", createOrderhandler);
orderRoutes.get("/:orderId/track", trackOrderHandler);
orderRoutes.post("/:orderId/cancel", cancelOrderHandler);