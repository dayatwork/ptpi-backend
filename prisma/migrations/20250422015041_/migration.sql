/*
  Warnings:

  - A unique constraint covering the columns `[event_id,exhibitor_id]` on the table `consultations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "consultations_event_id_exhibitor_id_key" ON "consultations"("event_id", "exhibitor_id");
