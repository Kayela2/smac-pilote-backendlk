/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import pg from 'pg'
import {config} from '../config.js'

// Return PostgreSQL `date` columns (OID 1082) as plain 'YYYY-MM-DD' strings
// instead of JS Date objects — avoids timezone shifts when serialised to JSON.
pg.types.setTypeParser(1082, (value: string) => value)

const isProd = process.env.MODE_ENV !== 'development'

/** Shared connection pool for the whole API (Prisma + raw queries). */
export const pool = new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    ssl: isProd ? {rejectUnauthorized: false} : false,
    keepAlive: true,
    keepAliveInitialDelayMillis: 100_000,
    connectionTimeoutMillis: 150_000,
    idleTimeoutMillis: 300_000,
    max: 10,
})

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err)
})
