/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import express, {type NextFunction, type Request, type Response} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import {fileURLToPath} from 'url'
import {config} from './config.js'
import {prisma} from './db/prisma.js'
import {fail, ok} from './utils/response.js'
import {asyncHandler} from './utils/asyncHandler.js'
import {authRouter} from './routes/auth.routes.js'
import {usersRouter} from './routes/users.routes.js'
import {chantiersRouter} from './routes/chantiers.routes.js'
import {actionsRouter} from './routes/actions.routes.js'
import {intervenantsRouter} from './routes/intervenants.routes.js'
import {interventionsRouter} from './routes/interventions.routes.js'
import {fichesRouter} from './routes/fiches.routes.js'
import {metaRouter} from './routes/meta.routes.js'
import {documentsRouter} from './routes/documents.routes.js'
import {foldersRouter} from './routes/folders.routes.js'
import {pvEtancheiteRouter} from './routes/pv-etancheite.routes.js'
import {fileStorageService} from './services/file-storage.service.js'
import swaggerUi from 'swagger-ui-express'
import {swaggerSpec} from './swagger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.join(__dirname, '../public')

const app = express()

app.use(cors({origin: config.clientOrigins, credentials: true}))
app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(config.uploadDir))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/api/v1/health', asyncHandler(async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`
        res.json(ok('ok', 'API healthy'))
    } catch {
        res.status(503).json(fail('Database unavailable'))
    }
}))

const V1 = '/api/v1'
app.use(`${V1}/auth`, authRouter)
app.use(`${V1}/users`, usersRouter)
app.use(`${V1}/chantiers`, chantiersRouter)
app.use(`${V1}/chantiers`, documentsRouter)
app.use(`${V1}/chantiers`, foldersRouter)
app.use(`${V1}/actions`, actionsRouter)
app.use(`${V1}/intervenants`, intervenantsRouter)
app.use(`${V1}/interventions`, interventionsRouter)
app.use(`${V1}/fiches`, fichesRouter)
app.use(`${V1}/meta-data`, metaRouter)
app.use(`${V1}/pv-etancheite`, pvEtancheiteRouter)

// Catch unmatched /api/* before the SPA fallback so they get a JSON 404
app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json(fail('Ressource introuvable'))
})

// Serve the built React app (production); fall through gracefully in dev
app.use(express.static(clientDist))
app.get('*', (_req: Request, res: Response) => {
    const index = path.join(clientDist, 'index.html')
    if (fs.existsSync(index)) {
        res.sendFile(index)
    } else {
        res.status(404).json(fail('Ressource introuvable'))
    }
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err)
    res.status(500).json(fail('Erreur interne du serveur'))
})

async function bootstrapAdmin(): Promise<void> {
    try {
        const existing = await prisma.user.findUnique({
            where: {matricule: config.bootstrap.matricule},
            select: {id: true},
        })
        if (existing) return

        const hash = await bcrypt.hash(config.bootstrap.password, 10)
        await prisma.user.create({
            data: {
                matricule: config.bootstrap.matricule,
                password: hash,
                role: config.bootstrap.role,
                person: {create: {lastName: config.bootstrap.lastName, firstName: config.bootstrap.firstName}},
            },
        })
        console.log(`Bootstrap admin created: matricule=${config.bootstrap.matricule}`)
    } catch (err) {
        console.error('Bootstrap admin error:', err)
    }
}

app.listen(config.port, () => {
    void (async () => {
        await fileStorageService.init()
        await bootstrapAdmin()
        console.log(`SMAC-PILOTE API listening on http://localhost:${config.port}`)
    })()
})
