-- AddForeignKey: Pago.registradoPorId → Usuario
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: Prestamo
CREATE INDEX "Prestamo_clienteId_idx" ON "Prestamo"("clienteId");
CREATE INDEX "Prestamo_asesorId_idx" ON "Prestamo"("asesorId");
CREATE INDEX "Prestamo_estado_idx" ON "Prestamo"("estado");
CREATE INDEX "Prestamo_eliminadoEn_idx" ON "Prestamo"("eliminadoEn");

-- CreateIndex: Cuota
CREATE INDEX "Cuota_prestamoId_idx" ON "Cuota"("prestamoId");
CREATE UNIQUE INDEX "Cuota_prestamoId_numero_key" ON "Cuota"("prestamoId", "numero");

-- CreateIndex: Pago
CREATE INDEX "Pago_prestamoId_idx" ON "Pago"("prestamoId");

-- CreateIndex: AuditLog
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");
