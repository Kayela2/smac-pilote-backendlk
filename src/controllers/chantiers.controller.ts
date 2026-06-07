import {chantiersService, type ChantierFilters} from '../services/chantiers.service.js'
import {organisationService} from '../services/organisation.service.js'
import {objectifsService} from '../services/objectifs.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import type {CreateChantierRequest, CreateIntervenantRequest, CreateActionRequest, UpdateChantierDetailsRequest, UpdateChantierRequest} from '../types.js'

export const chantiersController = {
    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateChantierRequest
        if (!b.codeOTP) { res.status(406).json(fail('Invalid entries!')); return }
        try {
            res.status(201).json(ok(await chantiersService.create(b), 'Chantier created successfully'))
        } catch {
            res.status(409).json(fail(`Chantier with given OTP ${b.codeOTP} already exist`))
        }
    }),

    createMass: asyncHandler(async (req, res) => {
        const items = req.body as CreateChantierRequest[]
        if (!Array.isArray(items) || items.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        res.status(201).json(ok(await chantiersService.createMass(items), 'chantiers created successfully'))
    }),

    addActions: asyncHandler(async (req, res) => {
        const items = req.body as CreateActionRequest[]
        if (!Array.isArray(items) || items.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        const result = await chantiersService.addActionsToChantier(req.params.chantierId, items)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.status(201).json(ok(result, 'Actions created successfully'))
    }),

    updateStatus: asyncHandler(async (req, res) => {
        const result = await chantiersService.updateStatus(req.params.chantierId, req.params.status)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.json(ok(result, "Chantier's status updated successfully"))
    }),

    getIntervenants: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        const {total, page: result} = await chantiersService.getIntervenantsPaginated(req.params.chantierId, page, size, offset)
        if (total === 0) { res.status(204).end(); return }
        res.json(ok(result, 'chantiers Retrieved Successfully'))
    }),

    getIntervenants2: asyncHandler(async (req, res) => {
        const records = await chantiersService.getIntervenantsAll(req.params.chantierId)
        if (records.length === 0) { res.status(204).end(); return }
        res.json(ok(records, 'chantiers Retrieved Successfully'))
    }),

    update: asyncHandler(async (req, res) => {
        try {
            res.json(ok(await chantiersService.update(req.params.chantierId, (req.body ?? {}) as UpdateChantierRequest), 'Chantier updated successfully'))
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2025') { res.status(404).json(fail('Not found')); return }
            res.status(409).json(fail('Chantier with given name already exist'))
        }
    }),

    updateDetails: asyncHandler(async (req, res) => {
        const result = await chantiersService.updateDetails(req.params.chantierId, (req.body ?? {}) as UpdateChantierDetailsRequest)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.json(ok(result, "Chantier's details updated successfully"))
    }),

    addIntervenantIds: asyncHandler(async (req, res) => {
        const ids = req.body as string[]
        if (!Array.isArray(ids) || ids.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        const p = await chantiersService.findById(req.params.chantierId)
        if (!p) { res.status(404).json(fail('Not found')); return }
        await chantiersService.addIntervenantIds(req.params.chantierId, ids)
        res.json(ok(p, 'Intervenants added successfully'))
    }),

    createAndAddIntervenants: asyncHandler(async (req, res) => {
        const items = req.body as CreateIntervenantRequest[]
        if (!Array.isArray(items) || items.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        const result = await chantiersService.createAndAddIntervenants(req.params.chantierId, items)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.json(ok(result, 'Intervenants created and added successfully'))
    }),

    getOrganisation: asyncHandler(async (req, res) => {
        res.json(ok(await organisationService.get(req.params.chantierId), 'Organisation retrieved'))
    }),

    setOrganisation: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as Partial<{conditionsAcces: unknown; conditionsStockage: unknown}>
        const conditionsAcces = Array.isArray(b.conditionsAcces) ? b.conditionsAcces.filter((x): x is string => typeof x === 'string') : []
        const conditionsStockage = Array.isArray(b.conditionsStockage) ? b.conditionsStockage.filter((x): x is string => typeof x === 'string') : []
        res.json(ok(await organisationService.set(req.params.chantierId, {conditionsAcces, conditionsStockage}), 'Organisation updated'))
    }),

    getObjectifs: asyncHandler(async (req, res) => {
        res.json(ok(await objectifsService.getByChantier(req.params.chantierId), 'Objectifs retrieved'))
    }),

    createObjectif: asyncHandler(async (req, res) => {
        const {objectif, tache} = (req.body ?? {}) as Partial<{objectif: string; tache: string}>
        if (!objectif?.trim()) { res.status(406).json(fail('objectif is required')); return }
        res.status(201).json(ok(await objectifsService.create(req.params.chantierId, objectif.trim(), tache?.trim()), 'Objectif created'))
    }),

    deleteObjectif: asyncHandler(async (req, res) => {
        const deleted = await objectifsService.delete(req.params.objectifId)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(null, 'Objectif deleted'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await chantiersService.delete(req.params.chantierId)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Chantier id=[${req.params.chantierId}] deleted`, `Chantier id=[${req.params.chantierId}] deleted`))
    }),

    getById: asyncHandler(async (req, res) => {
        const p = await chantiersService.findById(req.params.chantierId)
        if (!p) { res.status(404).json(fail('Not found')); return }
        res.json(ok(p, `Chantier ID [${req.params.chantierId}]`))
    }),

    getAll: asyncHandler(async (req, res) => {
        const {page, size} = getPagination(req)
        const q = req.query
        const codeOTP = q.codeOTP !== undefined && q.codeOTP !== '' ? Number(q.codeOTP) : undefined
        const filters: ChantierFilters = {
            codeOTP: codeOTP !== undefined && Number.isFinite(codeOTP) ? codeOTP : undefined,
            name: q.name ? String(q.name) : undefined,
            team: q.team ? String(q.team) : undefined,
            status: q.status ? String(q.status) : undefined,
            client: q.client ? String(q.client) : undefined,
        }
        if (q.progressFrom !== undefined || q.progressTo !== undefined) {
            const from = Number(q.progressFrom ?? 0)
            const to = Number(q.progressTo ?? 100)
            if (from > to || from < 0 || to > 100) { res.status(406).json(fail('Invalid progress range')); return }
            filters.progressFrom = from
            filters.progressTo = to
        } else if (q.progress !== undefined && q.progress !== '') {
            const progress = Number(q.progress)
            if (progress < 0 || progress > 100) { res.status(406).json(fail(`Progress [${progress}] must be between 0 and 100`)); return }
            filters.progress = progress
        }
        const result = await chantiersService.findAll(filters, page, size, getSort(req))
        if (result.totalElements === 0) { res.status(204).end(); return }
        res.json(ok(result, 'chantiers Retrieved Successfully'))
    }),
}
