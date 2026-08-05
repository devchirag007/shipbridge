/*
  Warnings:

  - Added the required column `courier_partner` to the `bulk_batch_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bulk_batch_items" ADD COLUMN     "courier_partner" TEXT NOT NULL;
