import {foldersService} from '../services/folders.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import type {CreateFolderRequest, UpdateFolderRequest} from '../types.js'

export const foldersController = {
    getByChantier: asyncHandler(async (req, res) => {
        res.json(ok(await foldersService.findByChantier(req.params.chantierId), 'Folders retrieved successfully'))
    }),

    getById: asyncHandler(async (req, res) => {
        const f = await foldersService.findById(req.params.id)
        if (!f) { res.status(404).json(fail('Not found')); return }
        res.json(ok(f, `Folder ID [${req.params.id}]`))
    }),

    create: asyncHandler(async (req, res) => {
        const b = (req.body ?? {}) as CreateFolderRequest
        if (!b.name || !b.name.trim()) { res.status(406).json(fail('Folder name is required')); return }
        try {
            res.status(201).json(ok(await foldersService.create(req.params.chantierId, b), 'Folder created successfully'))
        } catch {
            res.status(409).json(fail('Could not create folder (invalid parent or chantier)'))
        }
    }),

    update: asyncHandler(async (req, res) => {
        const result = await foldersService.update(req.params.id, (req.body ?? {}) as UpdateFolderRequest)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Not found')); return }
        if (result === 'CONFLICT') { res.status(409).json(fail('Could not update folder')); return }
        res.json(ok(result, 'Folder updated successfully'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await foldersService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`Folder id=[${req.params.id}] deleted`, `Folder id=[${req.params.id}] deleted`))
    }),
}
