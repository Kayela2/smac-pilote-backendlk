import path from 'path'
import fs from 'fs'
import multer from 'multer'
import {usersService, type UserFilters} from '../services/users.service.js'
import {config} from '../config.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import type {UpdatePasswordRequest, UpdateProfileRequest} from '../types.js'

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const storage = multer.diskStorage({
    destination(req, _file, cb) {
        const dir = path.join(config.uploadDir, req.params.id)
        fs.mkdirSync(dir, {recursive: true})
        cb(null, dir)
    },
    filename(_req, file, cb) {
        cb(null, `profile-picture${path.extname(file.originalname).toLowerCase()}`)
    },
})

export const upload = multer({
    storage,
    fileFilter(_req, file, cb) {
        cb(null, ALLOWED_EXTS.has(path.extname(file.originalname).toLowerCase()))
    },
    limits: {fileSize: 10 * 1024 * 1024},
})

export const usersController = {
    getAll: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        const matricule = req.query.matricule !== undefined && req.query.matricule !== '' ? Number(req.query.matricule) : undefined
        const filters: UserFilters = {
            matricule: matricule !== undefined && Number.isFinite(matricule) ? matricule : undefined,
        }
        res.json(ok(await usersService.findAll(filters, page, size, offset, getSort(req)), 'Users Retrieved Successfully'))
    }),

    getMe: asyncHandler(async (req, res) => {
        const user = await usersService.findById(req.user!.id)
        if (!user) { res.status(404).json(fail('Not found')); return }
        res.json(ok(user, 'My PROFILE User'))
    }),

    getById: asyncHandler(async (req, res) => {
        const user = await usersService.findById(req.params.id)
        if (!user) { res.status(404).json(fail('Not found')); return }
        res.json(ok(user, `User ID [${req.params.id}]`))
    }),

    updateProfile: asyncHandler(async (req, res) => {
        const user = await usersService.updateProfile(req.user!.id, (req.body ?? {}) as UpdateProfileRequest)
        res.json(ok(user, 'User updated!'))
    }),

    updatePassword: asyncHandler(async (req, res) => {
        const body = (req.body ?? {}) as UpdatePasswordRequest
        if (!body.oldPassword || !body.newPassword) {
            res.status(406).json(fail('Invalid entries!')); return
        }
        const result = await usersService.updatePassword(req.user!.id, body)
        if (result === 'WRONG_PASSWORD') { res.status(400).json(fail('Old password incorrect')); return }
        res.json(ok(result, 'Password updated!'))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await usersService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Not found')); return }
        res.json(ok(`User id=[${req.params.id}] deleted`, `User id=[${req.params.id}] deleted`))
    }),

    lock: asyncHandler(async (req, res) => {
        const locked = await usersService.lock(req.params.id)
        if (!locked) { res.status(404).json(fail('Not found')); return }
        res.json(ok('User locked', 'User locked'))
    }),

    uploadPhoto: asyncHandler(async (req, res) => {
        if (!req.file) { res.status(406).json(fail('No file or invalid file type')); return }
        const filePath = path.join('/uploads', req.params.id, req.file.filename)
        const saved = await usersService.savePhoto(req.params.id, filePath)
        if (!saved) { res.status(404).json(fail('Not found')); return }
        res.json(ok({profilePicture: saved}, 'Photo uploaded successfully'))
    }),

    getPhoto: asyncHandler(async (req, res) => {
        const photo = await usersService.getPhoto(req.params.id)
        res.json(ok(photo, 'Profile picture'))
    }),
}
