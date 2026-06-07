/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {documentsController, uploadDocument} from '../controllers/documents.controller.js'
import {docsPermissionController} from "../controllers/docs-permission.controller.js";

export const documentsRouter = Router()

/* public — Office Online must be able to fetch the file by URL */
documentsRouter.get('/:chantierId/documents/:id/stream', documentsController.stream)

documentsRouter.use(requireAuth)

documentsRouter.post('/:chantierId/documents', uploadDocument.single('file'), documentsController.upload)

documentsRouter.get('/:chantierId/documents', documentsController.getByChantier)
documentsRouter.get('/:chantierId/documents/:id', documentsController.getById)

documentsRouter.patch('/:chantierId/documents/:id/folder', documentsController.setFolder)

documentsRouter.delete('/:chantierId/documents/:id', documentsController.delete)

documentsRouter.get('/:chantierId/shared-docs', docsPermissionController.getShared)
documentsRouter.put('/:chantierId/shared-docs', docsPermissionController.setShared)

documentsRouter.get('/:chantierId/required-docs', docsPermissionController.getRequired)
documentsRouter.put('/:chantierId/required-docs', docsPermissionController.setRequired)
