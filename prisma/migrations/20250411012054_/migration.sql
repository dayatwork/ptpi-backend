/*
  Warnings:

  - You are about to drop the column `pricing_type` on the `seminars` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[online_room_id]` on the table `seminars` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "seminars" DROP COLUMN "pricing_type",
ADD COLUMN     "is_registration_open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "online_room_id" TEXT,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "seminars_online_room_id_key" ON "seminars"("online_room_id");
