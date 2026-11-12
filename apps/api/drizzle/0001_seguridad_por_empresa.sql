-- Separación por empresa con Row Level Security.
--
-- Cada transacción de la aplicación fija app.empresa_id (ver enEmpresa() en
-- src/nucleo/db.ts). Si no está fijada, la política no deja ver ni escribir
-- nada. FORCE aplica la regla incluso al dueño de la tabla.
--
-- Toda tabla de negocio nueva debe repetir este bloque (enable + force + policy).

CREATE FUNCTION empresa_actual() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.empresa_id', true), '')::uuid $$;
--> statement-breakpoint
ALTER TABLE "auditoria" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "auditoria" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "solo_su_empresa" ON "auditoria"
  USING ("empresa_id" = empresa_actual())
  WITH CHECK ("empresa_id" = empresa_actual());
