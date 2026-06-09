import multer from 'multer'
import {pvEtancheiteService} from '../services/pv-etancheite.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {prisma} from '../db/prisma.js'
import type {CreatePvEtancheiteRequest, UpdatePvEtancheiteRequest} from '../types.js'

export const uploadPvPdf = multer({
    storage: multer.memoryStorage(),
    fileFilter(_req, file, cb) { cb(null, file.mimetype === 'application/pdf') },
    limits: {fileSize: 20 * 1024 * 1024},
})

const ADMIN_ROLES = ['ADMIN_SUDO', 'ADMIN', 'MANAGER_USERS']

/**
 * Trouve l'Intervenant correspondant à l'utilisateur connecté.
 * Recherche par : id → numSAP/matricule → email.
 * Si aucun n'est trouvé, crée un nouvel Intervenant à partir des données User.
 */
async function resolveOrCreateIntervenant(userId: string, matricule: number, role: string): Promise<string | null> {
    // 1. Recherche par id (User.id = Intervenant.id)
    const byId = await prisma.intervenant.findUnique({where: {id: userId}, select: {id: true}})
    if (byId) return byId.id

    // 2. Recherche par numSAP ou matricule string
    const byMatricule = await prisma.intervenant.findFirst({
        where: {OR: [{numSAP: matricule}, {matricule: String(matricule)}]},
        select: {id: true},
    })
    if (byMatricule) return byMatricule.id

    // 3. Récupérer les données complètes du User pour l'email et la création
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            email:    true,
            matricule: true,
            person:   {
                select: {
                    firstName: true,
                    lastName:  true,
                    etablissement: {select: {idAgence: true}},
                },
            },
        },
    })
    if (!user) return null

    // 4. Recherche par email
    if (user.email) {
        const byEmail = await prisma.intervenant.findFirst({
            where: {mail: user.email},
            select: {id: true},
        })
        if (byEmail) return byEmail.id
    }

    // 5. Créer l'Intervenant depuis les données User
    const idAgence =
        user.person?.etablissement?.idAgence ??
        (await prisma.agence.findFirst({select: {id: true}}))?.id
    if (!idAgence) {
        console.warn(`[pv-etancheite] pas d'agence disponible pour créer Intervenant user.id=${userId}`)
        return null
    }

    const typeIntervenant = ADMIN_ROLES.includes(role) ? 'ConducteurTravaux' : 'CompagnonResponsable'
    const nom      = user.person?.lastName  ?? 'INCONNU'
    const prenom   = user.person?.firstName ?? ''
    const fullName = [prenom, nom].filter(Boolean).join(' ')

    try {
        const created = await prisma.intervenant.create({
            data: {
                id:              userId,
                typePole:        '',
                numSAP:          user.matricule,
                typeIntervenant: typeIntervenant,
                nom,
                prenom,
                fullName,
                matricule:       String(user.matricule),
                mail:            user.email ?? undefined,
                idAgence,
            },
            select: {id: true},
        })
        console.log(`[pv-etancheite] Intervenant créé automatiquement pour user.id=${userId}`)
        return created.id
    } catch {
        // Conflit de contrainte unique (numSAP déjà pris) — récupérer l'existant
        const fallback = await prisma.intervenant.findUnique({
            where: {numSAP: user.matricule},
            select: {id: true},
        })
        return fallback?.id ?? null
    }
}

export const pvEtancheiteController = {
    getAll: asyncHandler(async (req, res) => {
        const chantierId = req.query.chantierId ? (req.query.chantierId as string) : undefined
        if (!chantierId) { res.status(406).json(fail('chantierId is required')); return }
        res.json(ok(await pvEtancheiteService.findAll(chantierId), 'PV retrieved successfully'))
    }),

    getById: asyncHandler(async (req, res) => {
        const pv = await pvEtancheiteService.findById(req.params.id)
        if (!pv) { res.status(404).json(fail('Not found')); return }
        res.json(ok(pv, `PV [${req.params.id}]`))
    }),

    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreatePvEtancheiteRequest
        if (!b.idChantier || !b.zoneBatiment || !b.dateInspection || !b.responsableChantier ||
            !b.planReperage || !b.natureTravaux || !b.nomSmac || b.signatureSmac === undefined) {
                console.log("L'objet PV est ", b)
            res.status(406).json(fail('Missing required fields')); return
        }
        // Résoudre (ou créer) l'Intervenant du créateur depuis le cookie/JWT
        if (req.user?.id) {
            const intervenantId = await resolveOrCreateIntervenant(req.user.id, req.user.matricule, req.user.role)
            if (intervenantId) b.idIntervenant = intervenantId
        }
        try {
            res.status(201).json(ok(await pvEtancheiteService.create(b), 'PV created successfully'))
        } catch (e) {
            console.error('[pv-etancheite.create] error:', e)
            res.status(409).json(fail('Could not create PV'))
        }
    }),

    update: asyncHandler(async (req, res) => {
        const result = await pvEtancheiteService.update(req.params.id, (req.body ?? {}) as UpdatePvEtancheiteRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        res.json(ok(result, 'PV updated successfully'))
    }),

    createVersion: asyncHandler(async (req, res) => {
        if (!req.file?.buffer) { res.status(406).json(fail('Fichier PDF requis')); return }
        await pvEtancheiteService.createVersion(req.params.id, req.file.buffer)
        res.status(201).json(ok(null, 'Version enregistrée'))
    }),

    streamVersion: asyncHandler(async (req, res) => {
        const result = await pvEtancheiteService.streamVersion(req.params.docId)
        if (!result) { res.status(404).json(fail('Version introuvable')); return }
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="pv_version.pdf"`)
        result.stream.pipe(res)
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await pvEtancheiteService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`PV [${req.params.id}] deleted`, 'PV deleted successfully'))
    }),
}
