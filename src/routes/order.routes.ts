import { Router } from "express";
import { createOrderhandler } from "../controllers/order.controller.js";

export const orderRoutes = Router();

orderRoutes.post("/", createOrderhandler);