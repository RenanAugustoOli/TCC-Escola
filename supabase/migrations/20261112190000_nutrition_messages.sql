-- CreateTable
CREATE TABLE "NutritionMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionMessage_userId_createdAt_idx" ON "NutritionMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "NutritionMessage" ADD CONSTRAINT "NutritionMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

