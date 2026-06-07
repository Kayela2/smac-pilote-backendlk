/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import path from 'path'
import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import {fileStorageService} from './file-storage.service.js'
import {DocumentExtension, Motif} from '../enums.js'
import type {File, MappedDocumentation, UserWithRelations} from '../types.js'
import {Prisma, ChantierDocumentationMotif, ChantierDocumentationStatus} from '../generated/prisma/client.js'

/** "transfert-affaire" → "TRANSFERT_AFFAIRE" (app enum → Prisma enum) */
function toDbMotif(m: Motif): ChantierDocumentationMotif {
    return ChantierDocumentationMotif[
        m.replace(/-/g, '_').replace(/\//,'_').toUpperCase() as keyof typeof ChantierDocumentationMotif
    ]
}

/** "TRANSFERT_AFFAIRE" → "transfert-affaire" (Prisma enum → app enum) */
function fromDbMotif(m: ChantierDocumentationMotif): Motif {
    return m.toLowerCase().replace(/_/g, '-').replace('_caution','/caution').replace('_facturation','/facturation') as Motif
}

const docInclude = {
    author: {
        omit: {microsoftId: true, password: true, enabled: true, locked: true, createdAt: true, updatedAt: true},
        include: {person: {omit: {id: true}}, photo: true}
    },
} as const

type RawDoc = Prisma.ChantierDocumentationGetPayload<{ include: typeof docInclude }>

function mapDoc(d: RawDoc): MappedDocumentation {
    return {
        id: d.id,
        chantierId: d.chantierId,
        folderId: d.folderId,
        motif: fromDbMotif(d.motif),
        status: d.status,
        path: d.path,
        fileName: d.fileName,
        fileNameWithExtension: d.fileNameWithExtension,
        type: d.type as DocumentExtension,
        size: d.size,
        author: d.author as unknown as UserWithRelations,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    }
}

function docOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.ChantierDocumentationOrderByWithRelationInput {
    switch (field) {
        case 'name':         return {fileName: dir}
        case 'author':       return {author: {person: {firstName: dir}}}
        case 'deposit-date': return {createdAt: dir}
        case 'end-date':     return {endDate: dir}
        case 'status':       return {status: dir}
        default:             return {createdAt: 'desc'}
    }
}

async function paginatedDocs(
    where: Prisma.ChantierDocumentationWhereInput,
    page: number, size: number, offset: number,
    orderBy: Prisma.ChantierDocumentationOrderByWithRelationInput = {createdAt: 'desc'},
) {
    const [total, items] = await prisma.$transaction([
        prisma.chantierDocumentation.count({where}),
        prisma.chantierDocumentation.findMany({where, include: docInclude, orderBy, skip: offset, take: size}),
    ])
    return buildPage(items.map(mapDoc), total, page, size)
}

export const documentsService = {
    async upload(file: File, chantierId: string, authorId: string, motif: Motif): Promise<MappedDocumentation | string> {
        const chantier = await prisma.chantier.findUnique({where: {id: chantierId}, select: {id: true}})
        if (!chantier) return 'Chantier not found'

        const result = await fileStorageService.storeFile(file, chantierId, motif)
        if (typeof result === 'string') return result

        const fileNameWithExtension = path.basename(result.path)
        const fileName = path.basename(result.path, path.extname(result.path))
        const ext = path.extname(result.path).slice(1).toLowerCase()
        const doc = await prisma.chantierDocumentation.create({
            data: {
                chantierId,
                authorId,
                motif: toDbMotif(motif),
                status: ChantierDocumentationStatus.Deposited,
                endDate: null,
                path: result.path,
                fileName,
                fileNameWithExtension,
                type: ext,
                size: file.buffer.length,
            },
            include: docInclude,
        })
        return mapDoc(doc)
    },

    async findById(id: string): Promise<MappedDocumentation | null> {
        const doc = await prisma.chantierDocumentation.findUnique({where: {id}, include: docInclude})
        return doc ? mapDoc(doc) : null
    },

    findByChantier: (
        chantierId: string, page: number, size: number, offset: number,
        sort?: {field: string; dir: 'asc' | 'desc'}, motif?: Motif, folderId?: string | null,
    ) =>
        paginatedDocs(
            {
                chantierId,
                ...(motif ? {motif: toDbMotif(motif)} : {}),
                ...(folderId !== undefined ? {folderId} : {}),
            },
            page, size, offset, sort ? docOrderBy(sort.field, sort.dir) : undefined,
        ),

    /** Assigns a document to a folder (folderId=null moves it back to the root). */
    async setFolder(id: string, folderId: string | null): Promise<MappedDocumentation | 'NOT_FOUND'> {
        try {
            const doc = await prisma.chantierDocumentation.update({
                where: {id},
                data: {folderId, updatedAt: new Date()},
                include: docInclude,
            })
            return mapDoc(doc)
        } catch (e: unknown) {
            if ((e as { code?: string })?.code === 'P2025') return 'NOT_FOUND'
            throw e
        }
    },

    findByAuthor: (authorId: string, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedDocs({authorId}, page, size, offset, sort ? docOrderBy(sort.field, sort.dir) : undefined),

    async delete(id: string): Promise<boolean> {
        try {
            const doc = await prisma.chantierDocumentation.findUnique({where: {id}, select: {path: true}})
            if (!doc) return false
            await prisma.chantierDocumentation.delete({where: {id}})
            await fileStorageService.deleteFile(doc.path)
            return true
        } catch {
            return false
        }
    },

    async getFilePath(id: string): Promise<{path: string; fileName: string; type: string} | null> {
        const doc = await prisma.chantierDocumentation.findUnique({
            where: {id},
            select: {path: true, fileNameWithExtension: true, type: true},
        })
        return doc ? {path: doc.path, fileName: doc.fileNameWithExtension, type: doc.type} : null
    },
}
