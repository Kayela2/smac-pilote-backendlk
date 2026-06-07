import {beforeEach, describe, expect, it, vi} from 'vitest'
import {prismaMock, resetPrismaMock} from '../helpers/prisma-mock.js'

vi.mock('../../src/db/prisma.js', () => ({prisma: prismaMock}))
vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn(async () => 'hashed'),
    },
}))
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(() => 'signed.jwt.token'),
        verify: vi.fn(() => ({})),
    },
}))

const bcrypt = (await import('bcryptjs')).default as unknown as {
    compare: ReturnType<typeof vi.fn>
    hash: ReturnType<typeof vi.fn>
}
const jwt = (await import('jsonwebtoken')).default as unknown as {
    sign: ReturnType<typeof vi.fn>
    verify: ReturnType<typeof vi.fn>
}
const {authService} = await import('../../src/services/auth.service.js')

const baseUser = {
    id: 'u1', matricule: 10001, password: 'hashed', role: 'USER',
    enabled: true, locked: false, email: null, microsoftId: null,
    person: {firstName: 'Bruno', lastName: 'N', gender: null},
    photo: null,
}

beforeEach(() => {
    resetPrismaMock()
    bcrypt.compare.mockReset()
    bcrypt.hash.mockReset()
    bcrypt.hash.mockImplementation(async () => 'hashed')
    jwt.sign.mockReset()
    jwt.sign.mockImplementation(() => 'signed.jwt.token')
    jwt.verify.mockReset()
})

describe('authService.authenticate', () => {
    it("returns 'INVALID' when login is not numeric", async () => {
        await expect(authService.authenticate('not-a-number', 'pw')).resolves.toBe('INVALID')
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
    })

    it("returns 'INVALID' when the user is missing", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(null)
        await expect(authService.authenticate('10001', 'pw')).resolves.toBe('INVALID')
    })

    it("returns 'INVALID' when the password does not match", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(baseUser)
        bcrypt.compare.mockResolvedValueOnce(false)
        await expect(authService.authenticate('10001', 'pw')).resolves.toBe('INVALID')
    })

    it("returns 'DISABLED' when the account is disabled or locked", async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({...baseUser, enabled: false})
        bcrypt.compare.mockResolvedValueOnce(true)
        await expect(authService.authenticate('10001', 'pw')).resolves.toBe('DISABLED')

        prismaMock.user.findUnique.mockResolvedValueOnce({...baseUser, locked: true})
        bcrypt.compare.mockResolvedValueOnce(true)
        await expect(authService.authenticate('10001', 'pw')).resolves.toBe('DISABLED')
    })

    it('returns tokens + profile on success', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce(baseUser)
        bcrypt.compare.mockResolvedValueOnce(true)
        const result = await authService.authenticate('10001', 'pw')
        expect(result).toMatchObject({
            token: 'signed.jwt.token',
            refreshToken: 'signed.jwt.token',
            user: {matricule: 10001, firstName: 'Bruno', lastName: 'N', role: 'USER'},
        })
        expect(jwt.sign).toHaveBeenCalledTimes(2)
    })
})

describe('authService.register', () => {
    it('hashes the password and creates the user', async () => {
        prismaMock.user.create.mockResolvedValueOnce(baseUser)
        await authService.register({matricule: 10001, password: 'pw', firstName: 'Bruno', lastName: 'N'})
        expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10)
        expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({matricule: 10001, password: 'hashed', role: 'USER'}),
        }))
    })
})

describe('authService.registerMass', () => {
    it('skips invalid rows and catches individual failures', async () => {
        prismaMock.user.create
            .mockResolvedValueOnce(baseUser)
            .mockRejectedValueOnce(new Error('dup'))
        const result = await authService.registerMass([
            {matricule: 1, password: 'pw', firstName: 'A', lastName: 'B'},
            {matricule: 2, password: 'pw', firstName: 'C', lastName: 'D'},
            {matricule: undefined, password: 'pw', firstName: '', lastName: ''} as never,
        ])
        expect(result).toHaveLength(2)
        expect(result[1]).toBeNull()
    })
})

describe('authService.checkTokenValidity', () => {
    it('returns true when jwt.verify succeeds', () => {
        jwt.verify.mockReturnValueOnce({} as never)
        expect(authService.checkTokenValidity('any')).toBe(true)
    })

    it('returns false when jwt.verify throws', () => {
        jwt.verify.mockImplementationOnce(() => { throw new Error('bad') })
        expect(authService.checkTokenValidity('any')).toBe(false)
    })
})

describe('authService.findOrCreateMicrosoftUser', () => {
    it('uses an existing microsoft-linked user', async () => {
        prismaMock.user.findUnique.mockResolvedValueOnce({...baseUser, microsoftId: 'ms-1'})
        const result = await authService.findOrCreateMicrosoftUser(10001, 'ms-1', 'a@b.c', 'A', 'B')
        expect(prismaMock.user.update).not.toHaveBeenCalled()
        expect(prismaMock.user.create).not.toHaveBeenCalled()
        expect(result.user.matricule).toBe(10001)
    })

    it('links an existing email-only user with microsoftId', async () => {
        prismaMock.user.findUnique
            .mockResolvedValueOnce(null)                          // by microsoftId
            .mockResolvedValueOnce({...baseUser, email: 'a@b.c'}) // by email
        prismaMock.user.update.mockResolvedValueOnce({...baseUser, microsoftId: 'ms-1'})
        await authService.findOrCreateMicrosoftUser(10001, 'ms-1', 'A@B.C', 'A', 'B')
        expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
            data: {microsoftId: 'ms-1'},
        }))
    })

    it('creates a new user when neither match', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null)
        prismaMock.user.aggregate.mockResolvedValueOnce({_max: {matricule: 10005}})
        prismaMock.user.create.mockResolvedValueOnce({...baseUser, microsoftId: 'ms-new'})
        await authService.findOrCreateMicrosoftUser(99999, 'ms-new', 'a@b.c', 'A', 'B')
        expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({matricule: 99999, email: 'a@b.c', microsoftId: 'ms-new'}),
        }))
    })
})
