/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {foldersController} from '../controllers/folders.controller.js'

export const foldersRouter = Router()
foldersRouter.use(requireAuth)

foldersRouter.get('/:chantierId/folders', foldersController.getByChantier)
foldersRouter.get('/:chantierId/folders/:id', foldersController.getById)
foldersRouter.post('/:chantierId/folders', foldersController.create)
foldersRouter.put('/:chantierId/folders/:id', foldersController.update)
foldersRouter.delete('/:chantierId/folders/:id', foldersController.delete)
