/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import multer from 'multer'
import path from 'path'
import {documentsService} from '../services/documents.service.js'
import {fileStorageService} from '../services/file-storage.service.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {getPagination, getSort} from '../utils/pagination.js'
import {DocumentExtension, Motif} from '../enums.js'

const ALLOWED_EXTS = new Set(Object.values(DocumentExtension))

export const uploadDocument = multer({
    storage: multer.memoryStorage(),
    fileFilter(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase().slice(1)
        cb(null, ALLOWED_EXTS.has(ext as DocumentExtension))
    },
    limits: {fileSize: 50 * 1024 * 1024},
})

export const documentsController = {
    upload: asyncHandler(async (req, res) => {
        if (!req.file) {
            res.status(406).json(fail('No file or unsupported file type (accepted: doc, docx, pdf)'))
            return
        }
        const motif = req.query.motif as Motif | undefined
        if (!motif || !Object.values(Motif).includes(motif)) {
            res.status(406).json(fail(`Invalid or missing motif. Accepted: ${Object.values(Motif).join(', ')}`))
            return
        }
        const result = await documentsService.upload(
            {buffer: req.file.buffer, originalName: req.file.originalname},
            req.params.chantierId,
            req.user!.id,
            motif,
        )
        if (typeof result === 'string') {
            res.status(422).json(fail(result))
            return
        }
        res.status(201).json(ok(result, 'Document uploaded successfully'))
    }),

    getByChantier: asyncHandler(async (req, res) => {
        const {page, size, offset} = getPagination(req)
        const sort = getSort(req)
        let motif: Motif | undefined
        if (req.query.motif !== undefined && req.query.motif !== '') {
            const raw = String(req.query.motif).replace(/@/, '/') as Motif
            if (!Object.values(Motif).includes(raw)) {
                res.status(400).json(fail(`Invalid motif: ${raw}`))
                return
            }
            motif = raw
        }
        // folderId filter: omitted → all; "root"/"null" → unfiled (folderId IS NULL); <uuid> → that folder
        let folderId: string | null | undefined
        if (req.query.folderId !== undefined) {
            const raw = String(req.query.folderId)
            folderId = (raw === '' || raw === 'root' || raw === 'null') ? null : raw
        }
        res.json(ok(
            await documentsService.findByChantier(req.params.chantierId, page, size, offset, sort, motif, folderId),
            motif ? `Documents with motif [${motif}]` : 'Chantier documents retrieved successfully',
        ))
    }),

    setFolder: asyncHandler(async (req, res) => {
        const raw = (req.body ?? {}) as { folderId?: string | null }
        const folderId = raw.folderId == null || raw.folderId === '' ? null : String(raw.folderId)
        const result = await documentsService.setFolder(req.params.id, folderId)
        if (result === 'NOT_FOUND') { res.status(404).json(fail('Document not found')); return }
        res.json(ok(result, folderId ? `Document moved to folder [${folderId}]` : 'Document moved to root'))
    }),

    getById: asyncHandler(async (req, res) => {
        const doc = await documentsService.findById(req.params.id)
        if (!doc) { res.status(404).json(fail('Document not found')); return }
        res.json(ok(doc, `Document [${req.params.id}]`))
    }),

    delete: asyncHandler(async (req, res) => {
        const deleted = await documentsService.delete(req.params.id)
        if (!deleted) { res.status(404).json(fail('Document not found')); return }
        res.json(ok(`Document [${req.params.id}] deleted`, 'Document deleted'))
    }),

    stream: asyncHandler(async (req, res) => {
        const doc = await documentsService.getFilePath(req.params.id)
        if (!doc) { res.status(404).json(fail('Document not found')); return }

        const stream = await fileStorageService.getDownloadStream(doc.path)
        if (!stream) { res.status(404).json(fail('File not found in storage')); return }

        const mime: Record<string, string> = {
            pdf:  'application/pdf',
            doc:  'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        res.setHeader('Content-Type', mime[doc.type] ?? 'application/octet-stream')
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`)
        stream.pipe(res)
    }),
}
