import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {intervenantsController} from '../controllers/intervenants.controller.js'

export const intervenantsRouter = Router()
intervenantsRouter.use(requireAuth)

intervenantsRouter.get('/', intervenantsController.getAll)
intervenantsRouter.get('/:id', intervenantsController.getById)

intervenantsRouter.post('/', intervenantsController.create)
intervenantsRouter.post('/mass', intervenantsController.createMass)

intervenantsRouter.put('/:id', intervenantsController.update)

intervenantsRouter.delete('/:id', intervenantsController.delete)
