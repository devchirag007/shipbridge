import { NextFunction, Request, Response } from "express";
import { createOrder } from "../services/order.service.js";

export async function createOrderhandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { courier_partner, ...payload } = req.body;
        const order = await createOrder(courier_partner, payload);
        res.status(201).json(order);
    } catch (err) {
        next(err)
    }
}