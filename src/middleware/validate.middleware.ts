import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../types/errors.types";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const details = result.error.issues.map((issues) => ({
                field: issues.path.join("."),
                message: issues.message,
            }));
            return next(new ValidationError(details))
        }
        req.body = result.data;
        next();
    }
}