import {fichesService} from '../services/fiches.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import {TypeFiche} from '../generated/prisma/enums.js'
import type {CreateFicheRequest, UpdateFicheRequest} from '../types.js'

/** Resolve a route param (e.g. "fiche", "PV") to a TypeFiche enum value, or null. */
function resolveType(raw: string): TypeFiche | null {
    const upper = raw.trim().toUpperCase()
    return (Object.values(TypeFiche) as string[]).includes(upper) ? (upper as TypeFiche) : null
}

export const fichesController = {
    getAll: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        let type: TypeFiche | undefined
        if (typeof req.query.type === 'string' && req.query.type !== '') {
            const resolved = resolveType(req.query.type)
            if (!resolved) { res.status(406).json(fail(`Invalid fiche type [${req.query.type}]`)); return }
            type = resolved
        }
        res.json(ok(await fichesService.findAll({type}, page, size, offset, getSort(req)), 'Fiches retrieved successfully'))
    }),

    getById: asyncHandler(async (req, res) => {
        const f = await fichesService.findById(req.params.id)
        if (!f) { res.status(404).json(fail('Not found')); return }
        res.json(ok(f, `Fiche ID [${req.params.id}]`))
    }),

    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateFicheRequest
        if (!b.code || !b.name || !b.type) { res.status(406).json(fail('Invalid entries!')); return }
        try {
            res.status(201).json(ok(await fichesService.create(b), 'Fiche created successfully'))
        } catch {
            res.status(409).json(fail('Could not create fiche'))
        }
    }),

    update: asyncHandler(async (req, res) => {
        const result = await fichesService.update(req.params.id, (req.body ?? {}) as UpdateFicheRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        if (result === 'CONFLICT') { res.status(409).json(fail('Could not update fiche')); return }
        res.json(ok(result, 'Fiche updated successfully'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await fichesService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Fiche id=[${req.params.id}] deleted`, `Fiche id=[${req.params.id}] deleted`))
    }),
}
