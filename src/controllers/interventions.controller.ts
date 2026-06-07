import {interventionsService, type InterventionFilters} from '../services/interventions.service.js'
import {TypeDocEnum} from '../generated/prisma/enums.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import type {CreateInterventionRequest, UpdateInterventionRequest} from '../types.js'

const VALID_TYPE_DOCS = new Set(Object.values(TypeDocEnum))

export const interventionsController = {
    getAll: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        const q = req.query
        const filters: InterventionFilters = {
            idChantier: q.chantierId ? String(q.chantierId) : (q.idChantier ? String(q.idChantier) : undefined),
            idIntervenant: q.intervenantId ? String(q.intervenantId) : (q.idIntervenant ? String(q.idIntervenant) : undefined),
        }
        res.json(ok(await interventionsService.findAll(filters, page, size, offset, getSort(req)), 'Interventions retrieved successfully'))
    }),

    getById: asyncHandler(async (req, res) => {
        const id = req.params.id
        const iv = await interventionsService.findById(id)
        if (!iv) { res.status(404).json(fail('Not found')); return }
        res.json(ok(iv, `Intervention ID [${id}]`))
    }),

    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateInterventionRequest
        if (!b.idIntervenant || !b.idChantier || !b.dateAssignation) { res.status(406).json(fail('Invalid entries!')); return }
        if (!b.typeDoc || !VALID_TYPE_DOCS.has(b.typeDoc)) {
            res.status(406).json(fail(`Invalid or missing typeDoc. Accepted: ${[...VALID_TYPE_DOCS].join(', ')}`))
            return
        }
        try {
            res.status(201).json(ok(await interventionsService.create(b), 'Intervention created successfully'))
        } catch (e) {
            console.error('[interventions.create] error:', e)
            res.status(409).json(fail('Could not create intervention (unknown intervenant or chantier)'))
        }
    }),

    update: asyncHandler(async (req, res) => {
        const id = req.params.id
        const result = await interventionsService.update(id, (req.body ?? {}) as UpdateInterventionRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        if (result === 'CONFLICT') { res.status(409).json(fail('Could not update intervention (unknown intervenant or chantier)')); return }
        res.json(ok(result, 'Intervention updated successfully'))
    }),

    delete: asyncHandler(async (req, res) => {
        const id = req.params.id
        const deleted = await interventionsService.delete(id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Intervention id=[${id}] deleted`, `Intervention id=[${id}] deleted`))
    }),
}
