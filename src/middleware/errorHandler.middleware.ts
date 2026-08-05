import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors.types";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    console.log(err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.errorCode,
                message: err.message,
                details: err.details
            }
        })
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") { // Prisma's "record not found" code
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Resource not found" },
            });
        }
    }

    // fallback — anything unexpected
    return res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
}