import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Motif} from '../../src/enums.js'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))
vi.mock('../../src/services/file-storage.service.js', () => ({
    fileStorageService: {storeFile: vi.fn()},
}))

const {fileStorageService} = await import('../../src/services/file-storage.service.js')
const storeFile = fileStorageService.storeFile as unknown as ReturnType<typeof vi.fn>

const {documentsService} = await import('../../src/services/documents.service.js')

const fakeAuthor = {id: 'u1', matricule: 1, role: 'USER', email: null, person: {firstName: 'A', lastName: 'B'}, photo: null}
const baseDoc = {
    id: 'd1', chantierId: 'c1', authorId: 'u1', folderId: null,
    motif: 'TRANSFERT_AFFAIRE', status: 'Deposited',
    path: '/data/c1/transfert-affaire/x-1.pdf',
    fileName: 'x-1', fileNameWithExtension: 'x-1.pdf', type: 'pdf', size: 4,
    endDate: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    author: fakeAuthor,
}

beforeEach(() => {
    resetPrismaMock()
    storeFile.mockReset()
})

describe('documentsService.upload', () => {
    it("returns 'Chantier not found' when chantier missing", async () => {
        prismaMock.chantier.findUnique.mockResolvedValueOnce(null)
        const file = {buffer: Buffer.from('ok'), originalName: 'x.pdf'}
        await expect(documentsService.upload(file, 'missing', 'u1', Motif.TRANSFERT_AFFAIRE))
            .resolves.toBe('Chantier not found')
        expect(storeFile).not.toHaveBeenCalled()
    })

    it('propagates the error string from fileStorageService', async () => {
        prismaMock.chantier.findUnique.mockResolvedValueOnce({id: 'c1'})
        storeFile.mockReturnValueOnce('File type not accepted')
        const file = {buffer: Buffer.from('ok'), originalName: 'x.zip'}
        await expect(documentsService.upload(file, 'c1', 'u1', Motif.TRANSFERT_AFFAIRE))
            .resolves.toBe('File type not accepted')
        expect(prismaMock.chantierDocumentation.create).not.toHaveBeenCalled()
    })

    it('persists and returns the mapped doc on success', async () => {
        prismaMock.chantier.findUnique.mockResolvedValueOnce({id: 'c1'})
        storeFile.mockReturnValueOnce({path: '/data/c1/transfert-affaire/x-1.pdf', url: '/u/c1/x-1.pdf'})
        prismaMock.chantierDocumentation.create.mockResolvedValueOnce(baseDoc)
        const file = {buffer: Buffer.from('hi'), originalName: 'x.pdf'}
        const result = await documentsService.upload(file, 'c1', 'u1', Motif.TRANSFERT_AFFAIRE)
        expect(prismaMock.chantierDocumentation.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                chantierId: 'c1', authorId: 'u1',
                motif: 'TRANSFERT_AFFAIRE',
                fileName: 'x-1', fileNameWithExtension: 'x-1.pdf', type: 'pdf', size: 2,
            }),
        }))
        expect(result).toMatchObject({id: 'd1', motif: Motif.TRANSFERT_AFFAIRE, type: 'pdf'})
    })
})

describe('documentsService.findById', () => {
    it('returns null when missing', async () => {
        prismaMock.chantierDocumentation.findUnique.mockResolvedValueOnce(null)
        await expect(documentsService.findById('x')).resolves.toBeNull()
    })

    it('maps when found', async () => {
        prismaMock.chantierDocumentation.findUnique.mockResolvedValueOnce(baseDoc)
        await expect(documentsService.findById('d1')).resolves.toMatchObject({id: 'd1'})
    })
})

describe('documentsService.findByChantier (sort fallback + optional motif)', () => {
    it('defaults to createdAt desc and filters by chantier only', async () => {
        prismaMock.chantierDocumentation.count.mockResolvedValueOnce(0)
        prismaMock.chantierDocumentation.findMany.mockResolvedValueOnce([])
        await documentsService.findByChantier('c1', 0, 10, 0)
        expect(prismaMock.chantierDocumentation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {chantierId: 'c1'},
            orderBy: {createdAt: 'desc'},
        }))
    })

    it('adds the converted motif to the where when provided', async () => {
        prismaMock.chantierDocumentation.count.mockResolvedValueOnce(0)
        prismaMock.chantierDocumentation.findMany.mockResolvedValueOnce([])
        await documentsService.findByChantier('c1', 0, 10, 0, undefined, Motif.TRANSFERT_AFFAIRE)
        expect(prismaMock.chantierDocumentation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {chantierId: 'c1', motif: 'TRANSFERT_AFFAIRE'},
        }))
    })

    it('filters by folderId (null = root) when provided', async () => {
        prismaMock.chantierDocumentation.count.mockResolvedValueOnce(0)
        prismaMock.chantierDocumentation.findMany.mockResolvedValueOnce([])
        await documentsService.findByChantier('c1', 0, 10, 0, undefined, undefined, null)
        expect(prismaMock.chantierDocumentation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {chantierId: 'c1', folderId: null},
        }))
        prismaMock.chantierDocumentation.count.mockResolvedValueOnce(0)
        prismaMock.chantierDocumentation.findMany.mockResolvedValueOnce([])
        await documentsService.findByChantier('c1', 0, 10, 0, undefined, undefined, 'f1')
        expect(prismaMock.chantierDocumentation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {chantierId: 'c1', folderId: 'f1'},
        }))
    })

    it('applies known sort field "name" → fileName', async () => {
        prismaMock.chantierDocumentation.count.mockResolvedValueOnce(0)
        prismaMock.chantierDocumentation.findMany.mockResolvedValueOnce([])
        await documentsService.findByChantier('c1', 0, 10, 0, {field: 'name', dir: 'asc'})
        expect(prismaMock.chantierDocumentation.findMany).toHaveBeenCalledWith(expect.objectContaining({orderBy: {fileName: 'asc'}}))
    })
})

describe('documentsService.setFolder', () => {
    it('updates folderId and returns the mapped doc', async () => {
        prismaMock.chantierDocumentation.update.mockResolvedValueOnce({...baseDoc, folderId: 'f1'})
        const r = await documentsService.setFolder('d1', 'f1')
        expect(prismaMock.chantierDocumentation.update).toHaveBeenCalledWith(expect.objectContaining({
            where: {id: 'd1'}, data: expect.objectContaining({folderId: 'f1'}),
        }))
        expect(r).toMatchObject({id: 'd1', folderId: 'f1'})
    })

    it("returns 'NOT_FOUND' on P2025", async () => {
        prismaMock.chantierDocumentation.update.mockRejectedValueOnce(Object.assign(new Error('x'), {code: 'P2025'}))
        await expect(documentsService.setFolder('x', null)).resolves.toBe('NOT_FOUND')
    })
})

describe('documentsService.delete / getFilePath', () => {
    it('delete returns true/false', async () => {
        prismaMock.chantierDocumentation.delete.mockResolvedValueOnce(baseDoc)
        await expect(documentsService.delete('d1')).resolves.toBe(true)
        prismaMock.chantierDocumentation.delete.mockRejectedValueOnce(new Error('x'))
        await expect(documentsService.delete('d1')).resolves.toBe(false)
    })

    it('getFilePath returns null when missing', async () => {
        prismaMock.chantierDocumentation.findUnique.mockResolvedValueOnce(null)
        await expect(documentsService.getFilePath('x')).resolves.toBeNull()
    })

    it('getFilePath returns {path, fileName, type} when found', async () => {
        prismaMock.chantierDocumentation.findUnique.mockResolvedValueOnce({
            path: '/p.pdf', fileNameWithExtension: 'p.pdf', type: 'pdf',
        })
        await expect(documentsService.getFilePath('d1')).resolves.toEqual({path: '/p.pdf', fileName: 'p.pdf', type: 'pdf'})
    })
})
