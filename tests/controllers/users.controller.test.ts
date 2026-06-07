import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    findAll: vi.fn(),
    findById: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    delete: vi.fn(),
    lock: vi.fn(),
    savePhoto: vi.fn(),
    getPhoto: vi.fn(),
}

vi.mock('../../src/services/users.service.js', () => ({usersService: serviceMock}))

const {usersController} = await import('../../src/controllers/users.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('usersController.getMe / getById', () => {
    it('getMe returns 404 when user not found', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(usersController.getMe, mockReq({user: {id: 'u1'} as never}), res)
        expect(res.statusCode).toBe(404)
    })

    it('getById returns 404 when not found', async () => {
        serviceMock.findById.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(usersController.getById, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)
    })
})

describe('usersController.getAll', () => {
    it('passes the matricule query-param filter to the service', async () => {
        serviceMock.findAll.mockResolvedValueOnce({content: [], totalElements: 0, totalPages: 0, page: 0, size: 20})
        const res = mockRes()
        await invoke(usersController.getAll, mockReq({query: {matricule: '10001'}}), res)
        expect(res.statusCode).toBe(200)
        expect(serviceMock.findAll).toHaveBeenCalledWith(
            expect.objectContaining({matricule: 10001}),
            expect.any(Number), expect.any(Number), expect.any(Number), expect.anything(),
        )
    })
})

describe('usersController.updatePassword', () => {
    it('returns 406 for missing fields', async () => {
        const res = mockRes()
        await invoke(usersController.updatePassword, mockReq({body: {}, user: {id: 'u1'} as never}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 400 for WRONG_PASSWORD', async () => {
        serviceMock.updatePassword.mockResolvedValueOnce('WRONG_PASSWORD')
        const res = mockRes()
        await invoke(
            usersController.updatePassword,
            mockReq({body: {oldPassword: 'a', newPassword: 'b'}, user: {id: 'u1'} as never}),
            res,
        )
        expect(res.statusCode).toBe(400)
    })

    it('returns 200 on success', async () => {
        serviceMock.updatePassword.mockResolvedValueOnce({id: 'u1'})
        const res = mockRes()
        await invoke(
            usersController.updatePassword,
            mockReq({body: {oldPassword: 'a', newPassword: 'b'}, user: {id: 'u1'} as never}),
            res,
        )
        expect(res.statusCode).toBe(200)
    })
})

describe('usersController.delete / lock', () => {
    it('delete returns 404 / 200', async () => {
        serviceMock.delete.mockResolvedValueOnce(false)
        let res = mockRes()
        await invoke(usersController.delete, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)

        serviceMock.delete.mockResolvedValueOnce(true)
        res = mockRes()
        await invoke(usersController.delete, mockReq({params: {id: 'u1'}}), res)
        expect(res.statusCode).toBe(200)
    })

    it('lock returns 404 / 200', async () => {
        serviceMock.lock.mockResolvedValueOnce(false)
        let res = mockRes()
        await invoke(usersController.lock, mockReq({params: {id: 'x'}}), res)
        expect(res.statusCode).toBe(404)

        serviceMock.lock.mockResolvedValueOnce(true)
        res = mockRes()
        await invoke(usersController.lock, mockReq({params: {id: 'u1'}}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('usersController.uploadPhoto', () => {
    it('returns 406 when req.file is missing', async () => {
        const res = mockRes()
        await invoke(usersController.uploadPhoto, mockReq({params: {id: 'u1'}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 404 when service returns null', async () => {
        serviceMock.savePhoto.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(
            usersController.uploadPhoto,
            mockReq({params: {id: 'u1'}, file: {filename: 'profile.png'} as never}),
            res,
        )
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 with the stored path on success', async () => {
        serviceMock.savePhoto.mockResolvedValueOnce('/uploads/u1/profile.png')
        const res = mockRes()
        await invoke(
            usersController.uploadPhoto,
            mockReq({params: {id: 'u1'}, file: {filename: 'profile.png'} as never}),
            res,
        )
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({data: {profilePicture: '/uploads/u1/profile.png'}})
    })
})
