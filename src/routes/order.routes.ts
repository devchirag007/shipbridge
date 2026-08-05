import { Router } from "express";
import { cancelOrderHandler, createOrderhandler, trackOrderHandler } from "../controllers/order.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createOrderSchema } from "../validators/order.validation.js";

export const orderRoutes = Router();

orderRoutes.post("/", validate(createOrderSchema), createOrderhandler);
orderRoutes.get("/:orderId/track", trackOrderHandler);
orderRoutes.post("/:orderId/cancel", cancelOrderHandler);