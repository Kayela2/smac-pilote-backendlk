import {requiredDocsService} from '../services/required-docs.service.js'
import {sharedDocsService} from "../services/shared-docs.service.js";
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'

export const docsPermissionController = {
    getRequired: asyncHandler(async (req, res) => {
        res.json(ok(await requiredDocsService.getKeys(req.params.chantierId), 'Required documents retrieved successfully'))
    }),

    setRequired: asyncHandler(async (req, res) => {
        const body = (req.body ?? {}) as { keys?: unknown }
        if (!Array.isArray(body.keys)) { res.status(406).json(fail('"keys" must be an array of strings')); return }
        const keys = body.keys.filter((k): k is string => typeof k === 'string')
        res.json(ok(await requiredDocsService.setKeys(req.params.chantierId, keys), 'Required documents updated successfully'))
    }),

    getShared: asyncHandler(async (req, res) => {
        res.json(ok(await sharedDocsService.getKeys(req.params.chantierId), 'Shared documents retrieved successfully'))
    }),

    setShared: asyncHandler(async (req, res) => {
        const body = (req.body ?? {}) as { keys?: unknown }
        if (!Array.isArray(body.keys)) { res.status(406).json(fail('"keys" must be an array of strings')); return }
        const keys = body.keys.filter((k): k is string => typeof k === 'string')
        res.json(ok(await sharedDocsService.setKeys(req.params.chantierId, keys), 'Shared documents updated successfully'))
    })
}
