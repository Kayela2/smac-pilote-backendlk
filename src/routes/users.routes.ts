import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import {upload, usersController} from '../controllers/users.controller.js'

export const usersRouter = Router()
usersRouter.use(requireAuth)

usersRouter.post('/:id/photo', upload.single('file'), usersController.uploadPhoto)

usersRouter.put('/password', usersController.updatePassword)

usersRouter.patch('/lock/:id', usersController.lock)

usersRouter.get('/', usersController.getAll)
usersRouter.get('/me', usersController.getMe)
usersRouter.get('/:id', usersController.getById)
usersRouter.put('/', usersController.updateProfile)
usersRouter.get('/:id/photo', usersController.getPhoto)

usersRouter.delete('/:id', usersController.delete)
