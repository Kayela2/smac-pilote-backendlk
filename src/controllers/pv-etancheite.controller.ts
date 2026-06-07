import {pvEtancheiteService} from '../services/pv-etancheite.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import type {CreatePvEtancheiteRequest, UpdatePvEtancheiteRequest} from '../types.js'

export const pvEtancheiteController = {
    getAll: asyncHandler(async (req, res) => {
        const chantierId = req.query.chantierId ? String(req.query.chantierId) : undefined
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
                console.log("L'objet PV est ",b)
            res.status(406).json(fail('Missing required fields')); return
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

    delete: asyncHandler(async (req, res) => {
        const deleted = await pvEtancheiteService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`PV [${req.params.id}] deleted`, 'PV deleted successfully'))
    }),
}
