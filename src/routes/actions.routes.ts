import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {actionsController} from '../controllers/actions.controller.js'

export const actionsRouter = Router()
actionsRouter.use(requireAuth)

actionsRouter.post('/', actionsController.create)
actionsRouter.post('/:actionId/add-child', actionsController.addChild)
actionsRouter.post('/:actionId/add-children', actionsController.addChildren)

actionsRouter.put('/:actionId', actionsController.update)

actionsRouter.get('/:actionId', actionsController.getById)
actionsRouter.get('/', actionsController.getAll)

actionsRouter.delete('/:actionId', actionsController.delete)
