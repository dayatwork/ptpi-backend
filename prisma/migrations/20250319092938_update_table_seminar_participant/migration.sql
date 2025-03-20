/*
  Warnings:

  - Added the required column `userAvatar` to the `seminar_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `seminar_participants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seminar_participants" ADD COLUMN     "userAvatar" TEXT NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "seminar_participants_userName_idx" ON "seminar_participants"("userName");
