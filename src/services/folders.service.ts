/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import {prisma} from '../db/prisma.js'
import type {CreateFolderRequest, UpdateFolderRequest} from '../types.js'

type RawFolder = {
    id: string
    name: string
    chantierId: string
    parentId: string | null
    createdAt: Date
    updatedAt: Date
}

function mapFolder(f: RawFolder) {
    return {
        id: f.id,
        name: f.name,
        chantierId: f.chantierId,
        parentId: f.parentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
    }
}

export const foldersService = {
    /** Flat list of every folder for a chantier (the client builds the tree). */
    async findByChantier(chantierId: string) {
        const folders = await prisma.folder.findMany({
            where: {chantierId},
            orderBy: {name: 'asc'},
        })
        return folders.map(mapFolder)
    },

    async findById(id: string) {
        const f = await prisma.folder.findUnique({where: {id}})
        return f ? mapFolder(f) : null
    },

    async create(chantierId: string, b: CreateFolderRequest) {
        const f = await prisma.folder.create({
            data: {
                chantierId,
                name: b.name,
                parentId: b.parentId ?? null,
            },
        })
        return mapFolder(f)
    },

    async update(id: string, b: UpdateFolderRequest): Promise<ReturnType<typeof mapFolder> | 'NOT_FOUND' | 'CONFLICT'> {
        try {
            const f = await prisma.folder.update({
                where: {id},
                data: {
                    name: b.name ?? undefined,
                    parentId: b.parentId === undefined ? undefined : b.parentId,
                    updatedAt: new Date(),
                },
            })
            return mapFolder(f)
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2025') return 'NOT_FOUND'
            return 'CONFLICT'
        }
    },

    /** Deletes the folder; sub-folders cascade (FK), contained documents are detached (folderId → null). */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.folder.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },
}
