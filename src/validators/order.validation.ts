import { z } from "zod";

const addressSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    addressLine: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1)
})

const packageDetailsSchema = z.object({
    weightKg: z.number().positive(),
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    declaredValue: z.number().positive().optional()
})

export const createOrderSchema = z.object({
    courier_partner: z.string().min(1, "courier_partner is required"),
    clientOrderId: z.string().min(1, "clientOrderId is required"),
    pickupAddress: addressSchema,
    deliveryAddress: addressSchema,
    packageDetails: packageDetailsSchema
})