import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {fichesController} from '../controllers/fiches.controller.js'

export const fichesRouter = Router()
fichesRouter.use(requireAuth)

fichesRouter.get('/', fichesController.getAll)
fichesRouter.get('/:id', fichesController.getById)

fichesRouter.post('/', fichesController.create)

fichesRouter.put('/:id', fichesController.update)

fichesRouter.delete('/:id', fichesController.delete)
