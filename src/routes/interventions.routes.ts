import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {interventionsController} from '../controllers/interventions.controller.js'

export const interventionsRouter = Router()
interventionsRouter.use(requireAuth)

interventionsRouter.get('/', interventionsController.getAll)
interventionsRouter.get('/:id', interventionsController.getById)

interventionsRouter.post('/', interventionsController.create)

interventionsRouter.put('/:id', interventionsController.update)

interventionsRouter.delete('/:id', interventionsController.delete)
