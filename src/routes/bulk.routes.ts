import { Router } from "express";
import { createBulkHandler, getBulkStatusHandler } from "../controllers/bulk.controller";

export const bulkRoutes = Router();
bulkRoutes.post("/", createBulkHandler)
bulkRoutes.get("/:batchId", getBulkStatusHandler)