/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import 'dotenv/config'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
    port: Number(process.env.PORT) || 8080,
    jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    jwtExpires: Number(process.env.JWT_EXPIRES_IN) || 86_400000,
    refreshExpires: Number(process.env.REFRESH_EXPIRES_IN) || 604_800000,
    clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:4000')
        .split(',').map(s => s.trim()).filter(Boolean),
    uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../.data')),
    bootstrap: {
        matricule: Number(process.env.BOOTSTRAP_ADMIN_MATRICULE) || 10001,
        firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME || 'Sudo',
        lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME || 'Admin',
        password: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'pass01',
        role: process.env.BOOTSTRAP_ADMIN_ROLE || 'ADMIN',
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    azure: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        clientSecret: process.env.AZURE_CLIENT_SECRET || '',
        tenantId: process.env.AZURE_TENANT_ID || 'common',
        redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:8080/api/v1/auth/microsoft/callback',
    },
    db: {
        host: process.env.DB_HOST || '/var/run/postgresql',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'smac_pilote_database',
        user: process.env.DB_USER ?? '',
        password: process.env.DB_PASSWORD ?? '',
    },
    azureStorage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'smac-documents',
    },
}
