import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))

const {foldersService} = await import('../../src/services/folders.service.js')

const baseFolder = {
    id: 'f1', name: 'Plans', chantierId: 'c1', parentId: null,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
}

beforeEach(resetPrismaMock)

describe('foldersService.findByChantier', () => {
    it('lists folders for a chantier ordered by name', async () => {
        prismaMock.folder.findMany.mockResolvedValueOnce([baseFolder])
        const result = await foldersService.findByChantier('c1')
        expect(prismaMock.folder.findMany).toHaveBeenCalledWith({where: {chantierId: 'c1'}, orderBy: {name: 'asc'}})
        expect(result).toEqual([expect.objectContaining({id: 'f1', name: 'Plans', parentId: null})])
    })
})

describe('foldersService.findById', () => {
    it('returns null when missing', async () => {
        prismaMock.folder.findUnique.mockResolvedValueOnce(null)
        await expect(foldersService.findById('x')).resolves.toBeNull()
    })
    it('maps when found', async () => {
        prismaMock.folder.findUnique.mockResolvedValueOnce(baseFolder)
        await expect(foldersService.findById('f1')).resolves.toMatchObject({id: 'f1'})
    })
})

describe('foldersService.create', () => {
    it('creates a root folder (parentId defaults to null)', async () => {
        prismaMock.folder.create.mockResolvedValueOnce(baseFolder)
        await foldersService.create('c1', {name: 'Plans'})
        expect(prismaMock.folder.create).toHaveBeenCalledWith({data: {chantierId: 'c1', name: 'Plans', parentId: null}})
    })
    it('creates a sub-folder with the given parentId', async () => {
        prismaMock.folder.create.mockResolvedValueOnce({...baseFolder, id: 'f2', parentId: 'f1'})
        const r = await foldersService.create('c1', {name: 'Sous', parentId: 'f1'})
        expect(prismaMock.folder.create).toHaveBeenCalledWith({data: {chantierId: 'c1', name: 'Sous', parentId: 'f1'}})
        expect(r).toMatchObject({parentId: 'f1'})
    })
})

describe('foldersService.update', () => {
    it("returns 'NOT_FOUND' on P2025", async () => {
        prismaMock.folder.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(foldersService.update('x', {name: 'X'})).resolves.toBe('NOT_FOUND')
    })
    it("returns 'CONFLICT' on other errors", async () => {
        prismaMock.folder.update.mockRejectedValueOnce(Object.assign(new Error('e'), {code: 'P2003'}))
        await expect(foldersService.update('f1', {parentId: 'bad'})).resolves.toBe('CONFLICT')
    })
    it('renames on success', async () => {
        prismaMock.folder.update.mockResolvedValueOnce({...baseFolder, name: 'Renamed'})
        await expect(foldersService.update('f1', {name: 'Renamed'})).resolves.toMatchObject({name: 'Renamed'})
    })
})

describe('foldersService.delete', () => {
    it('returns true / false', async () => {
        prismaMock.folder.delete.mockResolvedValueOnce(baseFolder)
        await expect(foldersService.delete('f1')).resolves.toBe(true)
        prismaMock.folder.delete.mockRejectedValueOnce(new Error('x'))
        await expect(foldersService.delete('f1')).resolves.toBe(false)
    })
})
