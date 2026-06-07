import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    findByChantier: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
}

vi.mock('../../src/services/folders.service.js', () => ({foldersService: serviceMock}))

const {foldersController} = await import('../../src/controllers/folders.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('foldersController.getByChantier', () => {
    it('returns 200 with the folders', async () => {
        serviceMock.findByChantier.mockResolvedValueOnce([{id: 'f1'}])
        const res = mockRes()
        await invoke(foldersController.getByChantier, mockReq({params: {chantierId: 'c1'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findByChantier).toHaveBeenCalledWith('c1')
    })
})

describe('foldersController.getById', () => {
    it('returns 404 when missing', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(foldersController.getById, mockReq({params: {chantierId: 'c1', id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('returns 200 on hit', async () => {
        serviceMock.findById.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(foldersController.getById, mockReq({params: {chantierId: 'c1', id: 'f1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('foldersController.create', () => {
    it('returns 406 when name is missing/blank', async () => {
        const res = mockRes()
        await invoke(foldersController.create, mockReq({params: {chantierId: 'c1'}, body: {name: '  '}}), res)
        expect(res.statusCode).toBe(406)
        expect(serviceMock.create).not.toHaveBeenCalled()
    })
    it('returns 201 on success', async () => {
        serviceMock.create.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(foldersController.create, mockReq({params: {chantierId: 'c1'}, body: {name: 'Plans', parentId: null}}), res)
        expect(res.statusCode).toBe(201)
        expect(serviceMock.create).toHaveBeenCalledWith('c1', {name: 'Plans', parentId: null})
    })
    it('returns 409 when the service throws', async () => {
        serviceMock.create.mockRejectedValueOnce(new Error('fk'))
        const res = mockRes()
        await invoke(foldersController.create, mockReq({params: {chantierId: 'c1'}, body: {name: 'Plans'}}), res)
        expect(res.statusCode).toBe(409)
    })
})

describe('foldersController.update', () => {
    it('returns 404 for NOT_FOUND', async () => {
        serviceMock.update.mockResolvedValueOnce('NOT_FOUND')
        const res = mockRes()
        await invoke(foldersController.update, mockReq({params: {chantierId: 'c1', id: 'x'}, body: {name: 'X'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('returns 409 for CONFLICT', async () => {
        serviceMock.update.mockResolvedValueOnce('CONFLICT')
        const res = mockRes()
        await invoke(foldersController.update, mockReq({params: {chantierId: 'c1', id: 'f1'}, body: {}}), res)
        expect(res.statusCode).toBe(409)
    })
    it('returns 200 on success', async () => {
        serviceMock.update.mockResolvedValueOnce({id: 'f1'})
        const res = mockRes()
        await invoke(foldersController.update, mockReq({params: {chantierId: 'c1', id: 'f1'}, body: {name: 'R'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('foldersController.delete', () => {
    it('returns 404 when service returns false', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        const res = mockRes()
        await invoke(foldersController.delete, mockReq({params: {chantierId: 'c1', id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
    it('returns 200 on success', async () => {
        serviceMock.delete.mockResolvedValueOnce(true)
        const res = mockRes()
        await invoke(foldersController.delete, mockReq({params: {chantierId: 'c1', id: 'f1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})
