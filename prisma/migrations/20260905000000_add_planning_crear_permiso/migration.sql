-- Add missing 'crear' permission for 'usuario' role on 'planning' resource
INSERT INTO "rol_permisos" ("rolId", "recurso", "accion")
VALUES ('usuario', 'planning', 'crear')
ON CONFLICT ("rolId", "recurso", "accion") DO NOTHING;
