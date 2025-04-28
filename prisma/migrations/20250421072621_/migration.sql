-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "exhibitor_id" TEXT NOT NULL,
    "max_slot" INTEGER,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_slots" (
    "id" TEXT NOT NULL,
    "consultation_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "consultation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultations_event_id_idx" ON "consultations"("event_id");

-- CreateIndex
CREATE INDEX "consultations_exhibitor_id_idx" ON "consultations"("exhibitor_id");

-- CreateIndex
CREATE INDEX "consultation_slots_consultation_id_idx" ON "consultation_slots"("consultation_id");

-- CreateIndex
CREATE INDEX "consultation_slots_participant_id_idx" ON "consultation_slots"("participant_id");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_exhibitor_id_fkey" FOREIGN KEY ("exhibitor_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_slots" ADD CONSTRAINT "consultation_slots_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
