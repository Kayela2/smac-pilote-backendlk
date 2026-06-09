import type {Request} from 'express'
import {actionsService, type ActionFilters} from '../services/actions.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import type {CreateActionRequest, UpdateActionRequest} from '../types.js'

function getFilters(req: Request): ActionFilters {
    const q = req.query
    return {
        idChantier: typeof q.idChantier === 'string' ? q.idChantier : undefined,
        anomalyRef: typeof q.anomalyRef === 'string' ? q.anomalyRef : undefined,
        correctiveAction: typeof q.correctiveAction === 'string' ? q.correctiveAction : undefined,
        responsible: typeof q.responsible === 'string' ? q.responsible : undefined,
        status: typeof q.status === 'string' ? q.status : undefined,
        dueDate: typeof q.dueDate === 'string' ? new Date(q.dueDate) : undefined,
        dueDateAfter: typeof q.dueDateAfter === 'string' ? new Date(q.dueDateAfter) : undefined,
        dueDateBefore: typeof q.dueDateBefore === 'string' ? new Date(q.dueDateBefore) : undefined,
    }
}

export const actionsController = {
    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateActionRequest
        if (!b.responsible || !b.idChantier) { res.status(406).json(fail('Invalid entries!')); return }
        res.status(201).json(ok(await actionsService.create(b), 'Action created successfully'))
    }),

    addChild: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateActionRequest
        if (!b.responsible || !b.idChantier) { res.status(406).json(fail('Invalid entries!')); return }
        const result = await actionsService.addChild(req.params.actionId, b)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.status(201).json(ok(result, 'Child action added successfully'))
    }),

    addChildren: asyncHandler(async (req, res) => {
        const items = req.body as CreateActionRequest[]
        if (!Array.isArray(items) || items.length === 0) { res.status(406).json(fail('Invalid entries!')); return }
        const result = await actionsService.addChildren(req.params.actionId, items)
        if (!result) { res.status(404).json(fail('Not found')); return }
        res.status(201).json(ok(result, 'Children actions added successfully'))
    }),

    update: asyncHandler(async (req, res) => {
        const result = await actionsService.update(req.params.actionId, (req.body ?? {}) as UpdateActionRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        res.json(ok(result, 'Action updated successfully'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await actionsService.delete(req.params.actionId)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Action id=[${req.params.actionId}] deleted`, `Action id=[${req.params.actionId}] deleted`))
    }),

    getById: asyncHandler(async (req, res) => {
        const action = await actionsService.findById(req.params.actionId)
        if (!action) { res.status(404).json(fail('Not found')); return }
        res.json(ok(action, `Action ID [${req.params.actionId}]`))
    }),

    getAll: asyncHandler(async (req, res) => {
        const q = req.query
        if ((q.dueDateAfter && !q.dueDateBefore) || (!q.dueDateAfter && q.dueDateBefore)) {
            res.status(406).json(fail('dueDateAfter and dueDateBefore are required together')); return
        }
        const {page, size, offset} = getPagination(req)
        const {total, page: result} = await actionsService.findAll(getFilters(req), page, size, offset, getSort(req))
        if (total === 0) { res.status(204).end(); return }
        res.json(ok(result, 'Actions retrieved successfully'))
    }),
}
