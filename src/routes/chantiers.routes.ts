import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {chantiersController} from '../controllers/chantiers.controller.js'

export const chantiersRouter = Router()
chantiersRouter.use(requireAuth)

chantiersRouter.post('/', chantiersController.create)
chantiersRouter.post('/mass', chantiersController.createMass)
chantiersRouter.post('/:chantierId/action', chantiersController.addActions)

chantiersRouter.patch('/update/:chantierId/status/:status', chantiersController.updateStatus)
chantiersRouter.patch('/:chantierId/intervenants/ids', chantiersController.addIntervenantIds)
chantiersRouter.patch('/:chantierId/intervenants/create', chantiersController.createAndAddIntervenants)

chantiersRouter.put('/:chantierId', chantiersController.update)
chantiersRouter.put('/:chantierId/details', chantiersController.updateDetails)

chantiersRouter.get('/:chantierId/organisation', chantiersController.getOrganisation)
chantiersRouter.put('/:chantierId/organisation', chantiersController.setOrganisation)

chantiersRouter.get('/:chantierId/objectifs', chantiersController.getObjectifs)
chantiersRouter.post('/:chantierId/objectifs', chantiersController.createObjectif)
chantiersRouter.delete('/:chantierId/objectifs/:objectifId', chantiersController.deleteObjectif)

chantiersRouter.get('/:chantierId/intervenants', chantiersController.getIntervenants)
chantiersRouter.get('/:chantierId/intervenants-2', chantiersController.getIntervenants2)
chantiersRouter.get('/:chantierId', chantiersController.getById)
chantiersRouter.get('/', chantiersController.getAll)

chantiersRouter.delete('/:chantierId', chantiersController.delete)
