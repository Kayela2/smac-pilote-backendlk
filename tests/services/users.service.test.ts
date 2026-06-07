import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))
vi.mock('bcryptjs', () => ({
    default: {compare: vi.fn(), hash: vi.fn(async () => 'new-hash')},
}))

const bcrypt = (await import('bcryptjs')).default as unknown as {
    compare: ReturnType<typeof vi.fn>
    hash: ReturnType<typeof vi.fn>
}
const {usersService} = await import('../../src/services/users.service.js')

const rawUser = {
    id: 'u1', matricule: 10001, role: 'USER', phone: null,
    enabled: true, locked: false,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    person: {firstName: 'Bruno', lastName: 'N', gender: null},
    photo: null,
}

beforeEach(() => {
    resetPrismaMock()
    bcrypt.compare.mockReset()
    bcrypt.hash.mockReset()
    bcrypt.hash.mockImplementation(async () => 'new-hash')
})

describe('usersService.findAll', () => {
    it('runs count+findMany in a transaction', async () => {
        prismaMock.user.count.mockResolvedValueOnce(1)
        prismaMock.user.findMany.mockResolvedValueOnce([rawUser])
        const page = await usersService.findAll({}, 0, 10, 0)
        expect(prismaMock.$transaction).toHaveBeenCalledOnce()
        expect(page).toMatchObject({totalElements: 1, page: 0, size: 10})
        expect(page.content[0]).toMatchObject({matricule: 10001, firstName: 'Bruno'})
    })

    it('applies known sort field', async () => {
        prismaMock.user.count.mockResolvedValueOnce(0)
        prismaMock.user.findMany.mockResolvedValueOnce([])
        await usersService.findAll({}, 0, 10, 0, {field: 'lastName', dir: 'desc'})
        expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
            orderBy: {person: {lastName: 'desc'}},
        }))
    })

    it('filters by matricule', async () => {
        prismaMock.user.count.mockResolvedValueOnce(0)
        prismaMock.user.findMany.mockResolvedValueOnce([])
        await usersService.findAll({matricule: 10001}, 0, 10, 0)
        expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {matricule: 10001}}))
        expect(prismaMock.user.count).toHaveBeenCalledWith({where: {matricule: 10001}})
    })
})

describe('usersService.findById', () => {
    it('returns null when not found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null)
        await expect(usersService.findById('x')).resolves.toBeNull()
    })

    it('maps when found', async () => {
        prismaMock.user.findUnique.mockResolvedValue(rawUser)
        await expect(usersService.findById('u1')).resolves.toMatchObject({id: 'u1', matricule: 10001})
    })
})

describe('usersService.updatePassword', () => {
    it("returns 'WRONG_PASSWORD' when bcrypt.compare fails", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({...rawUser, password: 'old-hash'})
        bcrypt.compare.mockResolvedValueOnce(false)
        await expect(usersService.updatePassword('u1', {oldPassword: 'a', newPassword: 'b'}))
            .resolves.toBe('WRONG_PASSWORD')
    })

    it("returns 'WRONG_PASSWORD' when user is not found", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(null)
        await expect(usersService.updatePassword('x', {oldPassword: 'a', newPassword: 'b'}))
            .resolves.toBe('WRONG_PASSWORD')
    })

    it('updates with a freshly hashed password on success', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({...rawUser, password: 'old-hash'})
        bcrypt.compare.mockResolvedValueOnce(true)
        prismaMock.user.update.mockResolvedValueOnce(rawUser)
        await usersService.updatePassword('u1', {oldPassword: 'a', newPassword: 'b'})
        expect(bcrypt.hash).toHaveBeenCalledWith('b', 10)
        expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({password: 'new-hash'}),
        }))
    })
})

describe('usersService.delete / lock', () => {
    it('delete returns true/false', async () => {
        prismaMock.user.delete.mockResolvedValueOnce(rawUser)
        await expect(usersService.delete('u1')).resolves.toBe(true)
        prismaMock.user.delete.mockRejectedValueOnce(new Error('x'))
        await expect(usersService.delete('u1')).resolves.toBe(false)
    })

    it('lock returns true/false', async () => {
        prismaMock.user.update.mockResolvedValueOnce(rawUser)
        await expect(usersService.lock('u1')).resolves.toBe(true)
        prismaMock.user.update.mockRejectedValueOnce(new Error('x'))
        await expect(usersService.lock('u1')).resolves.toBe(false)
    })
})

describe('usersService.savePhoto / getPhoto', () => {
    it('savePhoto returns null when user not found', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(null)
        await expect(usersService.savePhoto('x', '/uploads/x.png')).resolves.toBeNull()
        expect(prismaMock.userPhoto.upsert).not.toHaveBeenCalled()
    })

    it('savePhoto upserts the photo when the user exists', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(rawUser)
        prismaMock.userPhoto.upsert.mockResolvedValueOnce({})
        const result = await usersService.savePhoto('u1', '/uploads/x.png')
        expect(result).toBe('/uploads/x.png')
        expect(prismaMock.userPhoto.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: {id: 'u1'},
            create: expect.objectContaining({profilePicture: '/uploads/x.png'}),
        }))
    })

    it('getPhoto returns null when not found', async () => {
        prismaMock.userPhoto.findFirst.mockResolvedValueOnce(null)
        await expect(usersService.getPhoto('u1')).resolves.toBeNull()
    })

    it('getPhoto returns {profilePicture} when found', async () => {
        prismaMock.userPhoto.findFirst.mockResolvedValueOnce({profilePicture: '/p.png'})
        await expect(usersService.getPhoto('u1')).resolves.toEqual({profilePicture: '/p.png'})
    })
})
