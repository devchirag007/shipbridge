import { Request, Response, NextFunction } from "express";
import * as bulkService from "../services/bulk.service";

export async function createBulkHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { orders } = req.body;

        if (!Array.isArray(orders) || orders.length === 0 || orders.length > 100) {
            return res.status(400).json({
                error: { code: "INVALID_BULK_REQUEST", message: "orders must be an array of 1-100 items" }
            })
        }

        const batch = await bulkService.createbulkBatch(orders);

        res.status(202).json({
            batchId: batch.id,
            totalOrders: batch.totalOrders,
            statusUrl: `/api/v1/orders/bulk/${batch.id}`
        })

    } catch (err) {
        next(err)
    }
}

export async function getBulkStatusHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const { batchId } = req.params;
        const status = await bulkService.getBulkBatchStatus(batchId as string);

        res.status(200).json(status)

    } catch (err) {
        next(err)
    }
}