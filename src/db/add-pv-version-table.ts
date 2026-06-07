import 'dotenv/config'
import {pool} from './pool.js'

const sql = `
  CREATE TABLE IF NOT EXISTS "pv_etan_version" (
    "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
    "id_documentation" UUID          NOT NULL,
    "version_num"      INTEGER       NOT NULL,
    "snapshot"         JSONB         NOT NULL,
    "saved_at"         TIMESTAMP(6)  NOT NULL DEFAULT NOW(),

    CONSTRAINT "pv_etan_version_pkey"
      PRIMARY KEY ("id"),
    CONSTRAINT "pv_etan_version_id_documentation_fkey"
      FOREIGN KEY ("id_documentation")
      REFERENCES "documentation"("id_documentation")
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "pv_etan_version_id_documentation_idx"
    ON "pv_etan_version"("id_documentation");
`

const client = await pool.connect()
try {
  await client.query(sql)
  console.log('✅ Table pv_etan_version créée (ou déjà existante).')
} finally {
  client.release()
  await pool.end()
}
