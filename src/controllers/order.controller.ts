import { NextFunction, Request, Response } from "express";
import { createOrder, trackOrder, cancelOrder } from "../services/order.service.js";

export async function createOrderhandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { courier_partner, ...payload } = req.body;
        const order = await createOrder(courier_partner, payload);
        res.status(201).json(order);
    } catch (err) {
        next(err)
    }
}

export async function trackOrderHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { orderId } = req.params;
        const order = await trackOrder(orderId as string);
        res.status(200).json(order);
    } catch (err) {
        next(err);
    }
}

export async function cancelOrderHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { orderId } = req.params;
        const order = await cancelOrder(orderId as string);
        res.status(200).json(order);
    } catch (err) {
        next(err);
    }
}