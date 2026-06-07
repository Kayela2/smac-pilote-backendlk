import type {Request} from 'express'
import {intervenantsService, type IntervenantFilters} from '../services/intervenants.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import type {CreateIntervenantRequest, UpdateIntervenantRequest} from '../types.js'

function getFilters(req: Request): IntervenantFilters {
    const q = req.query
    const numSAP = q.numSAP !== undefined && q.numSAP !== '' ? Number(q.numSAP) : undefined
    return {
        numSAP: numSAP !== undefined && Number.isFinite(numSAP) ? numSAP : undefined,
        mail: q.mail ? String(q.mail) : undefined,
        phone: q.phone ? String(q.phone) : undefined,
        fullName: q.fullName ? String(q.fullName) : undefined,
        typePole: q.typePole ? String(q.typePole) : undefined,
        address: q.address ? String(q.address) : undefined,
    }
}

export const intervenantsController = {
    getAll: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        res.json(ok(await intervenantsService.findAll(getFilters(req), page, size, offset, getSort(req)), 'Intervenants retrieved successfully'))
    }),

    getById: asyncHandler(async (req, res) => {
        const sh = await intervenantsService.findById(req.params.id)
        if (!sh) { res.status(404).json(fail('Not found')); return }
        res.json(ok(sh, `Intervenant ID [${req.params.id}]`))
    }),

    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateIntervenantRequest
        if (!b.typePole || !b.numSAP || !b.fullName) { res.status(406).json(fail('Invalid entries!')); return }
        try {
            res.status(201).json(ok(await intervenantsService.create(b), 'Intervenant created successfully'))
        } catch {
            res.status(409).json(fail('Intervenant already exists (unique constraint)'))
        }
    }),

    createMass: asyncHandler(async (req, res) => {
        const items = req.body as CreateIntervenantRequest[]
        if (!Array.isArray(items) || items.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        res.status(201).json(ok(await intervenantsService.createMass(items), 'Intervenants created successfully'))
    }),

    update: asyncHandler(async (req, res) => {
        const result = await intervenantsService.update(req.params.id, (req.body ?? {}) as UpdateIntervenantRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        if (result === 'CONFLICT') { res.status(409).json(fail('Unique constraint violation')); return }
        res.json(ok(result, 'Intervenant updated successfully'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await intervenantsService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Intervenant id=[${req.params.id}] deleted`, `Intervenant id=[${req.params.id}] deleted`))
    }),
}
