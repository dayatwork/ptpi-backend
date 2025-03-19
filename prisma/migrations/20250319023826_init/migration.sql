-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorEnabled" BOOLEAN,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seminars" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT,
    "format" TEXT NOT NULL,
    "pricing_type" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seminars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seminar_participants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seminar_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "certificate" TEXT,

    CONSTRAINT "seminar_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT,
    "format" TEXT NOT NULL,
    "pricing_type" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibition_visitors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exhibition_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "exhibition_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitors" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "exhibition_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "amount" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(13,2) NOT NULL DEFAULT 0,

    CONSTRAINT "exhibitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsorships" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "seminar_id" TEXT,
    "exhibition_id" TEXT,
    "category" TEXT NOT NULL,
    "category_size" SMALLINT NOT NULL,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "amount" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(13,2) NOT NULL DEFAULT 0,

    CONSTRAINT "sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_name_idx" ON "user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "institutions_name_idx" ON "institutions"("name");

-- CreateIndex
CREATE INDEX "events_title_idx" ON "events"("title");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_format_idx" ON "events"("format");

-- CreateIndex
CREATE INDEX "seminars_event_id_idx" ON "seminars"("event_id");

-- CreateIndex
CREATE INDEX "seminars_title_idx" ON "seminars"("title");

-- CreateIndex
CREATE INDEX "seminars_format_idx" ON "seminars"("format");

-- CreateIndex
CREATE INDEX "seminars_start_date_idx" ON "seminars"("start_date");

-- CreateIndex
CREATE INDEX "seminars_status_idx" ON "seminars"("status");

-- CreateIndex
CREATE INDEX "seminar_participants_seminar_id_status_idx" ON "seminar_participants"("seminar_id", "status");

-- CreateIndex
CREATE INDEX "seminar_participants_user_id_idx" ON "seminar_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seminar_participants_seminar_id_user_id_key" ON "seminar_participants"("seminar_id", "user_id");

-- CreateIndex
CREATE INDEX "exhibitions_event_id_idx" ON "exhibitions"("event_id");

-- CreateIndex
CREATE INDEX "exhibitions_title_idx" ON "exhibitions"("title");

-- CreateIndex
CREATE INDEX "exhibitions_format_idx" ON "exhibitions"("format");

-- CreateIndex
CREATE INDEX "exhibitions_start_date_idx" ON "exhibitions"("start_date");

-- CreateIndex
CREATE INDEX "exhibitions_status_idx" ON "exhibitions"("status");

-- CreateIndex
CREATE INDEX "exhibition_visitors_exhibition_id_status_idx" ON "exhibition_visitors"("exhibition_id", "status");

-- CreateIndex
CREATE INDEX "exhibition_visitors_user_id_idx" ON "exhibition_visitors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exhibition_visitors_exhibition_id_user_id_key" ON "exhibition_visitors"("exhibition_id", "user_id");

-- CreateIndex
CREATE INDEX "exhibitors_exhibition_id_idx" ON "exhibitors"("exhibition_id");

-- CreateIndex
CREATE INDEX "exhibitors_institution_id_idx" ON "exhibitors"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "exhibitors_exhibition_id_institution_id_key" ON "exhibitors"("exhibition_id", "institution_id");

-- CreateIndex
CREATE INDEX "sponsorships_institution_id_idx" ON "sponsorships"("institution_id");

-- CreateIndex
CREATE INDEX "sponsorships_seminar_id_status_idx" ON "sponsorships"("seminar_id", "status");

-- CreateIndex
CREATE INDEX "sponsorships_exhibition_id_status_idx" ON "sponsorships"("exhibition_id", "status");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seminar_participants" ADD CONSTRAINT "seminar_participants_seminar_id_fkey" FOREIGN KEY ("seminar_id") REFERENCES "seminars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_visitors" ADD CONSTRAINT "exhibition_visitors_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitors" ADD CONSTRAINT "exhibitors_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitors" ADD CONSTRAINT "exhibitors_exhibition_id_fkey" FOREIGN KEY ("exhibition_id") REFERENCES "exhibitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsorships" ADD CONSTRAINT "sponsorships_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
