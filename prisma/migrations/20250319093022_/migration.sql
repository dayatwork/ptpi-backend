/*
  Warnings:

  - You are about to drop the column `userAvatar` on the `seminar_participants` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `seminar_participants` table. All the data in the column will be lost.
  - Added the required column `user_avatar` to the `seminar_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_name` to the `seminar_participants` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "seminar_participants_userName_idx";

-- AlterTable
ALTER TABLE "seminar_participants" DROP COLUMN "userAvatar",
DROP COLUMN "userName",
ADD COLUMN     "user_avatar" TEXT NOT NULL,
ADD COLUMN     "user_name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "seminar_participants_user_name_idx" ON "seminar_participants"("user_name");
