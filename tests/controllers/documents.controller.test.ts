import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    upload: vi.fn(),
    findByChantier: vi.fn(),
    findById: vi.fn(),
    setFolder: vi.fn(),
    delete: vi.fn(),
    getFilePath: vi.fn(),
}

vi.mock('../../src/services/documents.service.js', () => ({documentsService: serviceMock}))
vi.mock('node:fs', () => ({
    default: {existsSync: vi.fn(() => false), createReadStream: vi.fn()},
    existsSync: vi.fn(() => false),
    createReadStream: vi.fn(),
}))

const fs = (await import('node:fs')).default as unknown as {
    existsSync: ReturnType<typeof vi.fn>
    createReadStream: ReturnType<typeof vi.fn>
}
const {documentsController} = await import('../../src/controllers/documents.controller.js')

beforeEach(() => {
    for (const fn of Object.values(serviceMock)) fn.mockReset()
    fs.existsSync.mockReset()
    fs.createReadStream.mockReset()
})

describe('documentsController.upload', () => {
    it('returns 406 when no file present', async () => {
        const res = mockRes()
        await invoke(documentsController.upload, mockReq({query: {motif: 'transfert-affaire'}, params: {chantierId: 'c1'}, user: {id: 'u1'} as never}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 406 when motif is invalid', async () => {
        const res = mockRes()
        await invoke(documentsController.upload, mockReq({
            query: {motif: 'nope'},
            params: {chantierId: 'c1'},
            file: {buffer: Buffer.from('x'), originalname: 'a.pdf'} as never,
            user: {id: 'u1'} as never,
        }), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 422 when the service returns an error string', async () => {
        serviceMock.upload.mockResolvedValueOnce('Chantier not found')
        const res = mockRes()
        await invoke(documentsController.upload, mockReq({
            query: {motif: 'transfert-affaire'},
            params: {chantierId: 'c1'},
            file: {buffer: Buffer.from('x'), originalname: 'a.pdf'} as never,
            user: {id: 'u1'} as never,
        }), res)
        expect(res.statusCode).toBe(422)
    })

    it('returns 201 with the doc on success', async () => {
        serviceMock.upload.mockResolvedValueOnce({id: 'd1'})
        const res = mockRes()
        await invoke(documentsController.upload, mockReq({
            query: {motif: 'transfert-affaire'},
            params: {chantierId: 'c1'},
            file: {buffer: Buffer.from('x'), originalname: 'a.pdf'} as never,
            user: {id: 'u1'} as never,
        }), res)
        expect(res.statusCode).toBe(201)
    })
})

describe('documentsController.getByChantier', () => {
    it('delegates without a motif when none is given', async () => {
        serviceMock.findByChantier.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(documentsController.getByChantier, mockReq({params: {chantierId: 'c1'}, query: {}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findByChantier).toHaveBeenCalledWith('c1', 0, 20, 0, expect.anything(), undefined, undefined)
    })

    it('returns 400 when the motif query is invalid', async () => {
        const res = mockRes()
        await invoke(documentsController.getByChantier, mockReq({params: {chantierId: 'c1'}, query: {motif: 'nope'}}), res)
        expect(res.statusCode).toBe(400)
        expect(serviceMock.findByChantier).not.toHaveBeenCalled()
    })

    it('un-escapes "@" → "/" for sub-motifs and delegates', async () => {
        serviceMock.findByChantier.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(documentsController.getByChantier, mockReq({params: {chantierId: 'c1'}, query: {motif: 'financial-monitoring@caution'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findByChantier).toHaveBeenCalledWith('c1', 0, 20, 0, expect.anything(), 'financial-monitoring/caution', undefined)
    })

    it('maps folderId="root" to a null folder filter', async () => {
        serviceMock.findByChantier.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(documentsController.getByChantier, mockReq({params: {chantierId: 'c1'}, query: {folderId: 'root'}}), res)
        expect(serviceMock.findByChantier).toHaveBeenCalledWith('c1', 0, 20, 0, expect.anything(), undefined, null)
    })

    it('passes a folderId through as a filter', async () => {
        serviceMock.findByChantier.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(documentsController.getByChantier, mockReq({params: {chantierId: 'c1'}, query: {folderId: 'f1'}}), res)
        expect(serviceMock.findByChantier).toHaveBeenCalledWith('c1', 0, 20, 0, expect.anything(), undefined, 'f1')
    })
})

describe('documentsController.setFolder', () => {
    it('moves a document into a folder', async () => {
        serviceMock.setFolder.mockResolvedValueOnce({id: 'd1', folderId: 'f1'})
        const res = mockRes()
        await invoke(documentsController.setFolder, mockReq({params: {chantierId: 'c1', id: 'd1'}, body: {folderId: 'f1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.setFolder).toHaveBeenCalledWith('d1', 'f1')
    })

    it('moves a document back to root when folderId is null', async () => {
        serviceMock.setFolder.mockResolvedValueOnce({id: 'd1', folderId: null})
        const res = mockRes()
        await invoke(documentsController.setFolder, mockReq({params: {chantierId: 'c1', id: 'd1'}, body: {folderId: null}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.setFolder).toHaveBeenCalledWith('d1', null)
    })

    it('returns 404 when the document is missing', async () => {
        serviceMock.setFolder.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(documentsController.setFolder, mockReq({params: {chantierId: 'c1', id: 'x'}, body: {folderId: 'f1'}}), res)
        expect(res.statusCode).toBe(404)
    })
})

describe('documentsController.getById / delete', () => {
    it('getById returns 404 when missing', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(documentsController.getById, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('delete returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(documentsController.delete, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
})

describe('documentsController.stream', () => {
    it('returns 404 when getFilePath returns null', async () => {
        serviceMock.getFilePath.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(documentsController.stream, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 404 when the file is missing on disk', async () => {
        serviceMock.getFilePath.mockResolvedValueOnce({path: '/x.pdf', fileName: 'x.pdf', type: 'pdf'})
        fs.existsSync.mockReturnValueOnce(false)
        const res = mockRes()
        await invoke(documentsController.stream, mockReq({params: {id: 'd1'}}), res)
        expect(res.statusCode).toBe(404)
    })

    it('streams with the correct headers when the file exists', async () => {
        serviceMock.getFilePath.mockResolvedValueOnce({path: '/x.pdf', fileName: 'x.pdf', type: 'pdf'})
        fs.existsSync.mockReturnValueOnce(true)
        const fakeStream = {pipe: vi.fn()}
        fs.createReadStream.mockReturnValueOnce(fakeStream)
        const res = mockRes()
        await invoke(documentsController.stream, mockReq({params: {id: 'd1'}}), res)
        expect(res.headers['Content-Type']).toBe('application/pdf')
        expect(res.headers['Content-Disposition']).toMatch(/x\.pdf/)
        expect(fakeStream.pipe).toHaveBeenCalledWith(res)
    })
})
