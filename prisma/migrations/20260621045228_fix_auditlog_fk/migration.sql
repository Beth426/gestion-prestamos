-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "audit_prestamo";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "prestamoId" TEXT;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
