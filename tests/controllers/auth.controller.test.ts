import {beforeEach, describe, expect, it, vi} from 'vitest'
import {invoke, mockReq, mockRes} from '../helpers/http-mock.js'

const serviceMock = {
    authenticate: vi.fn(),
    checkTokenValidity: vi.fn(),
    register: vi.fn(),
    registerMass: vi.fn(),
    getMe: vi.fn(),
    findOrCreateMicrosoftUser: vi.fn(),
}

vi.mock('../../src/services/auth.service.js', () => ({authService: serviceMock}))

const {authController} = await import('../../src/controllers/auth.controller.js')

beforeEach(() => { for (const fn of Object.values(serviceMock)) fn.mockReset() })

describe('authController.authenticate', () => {
    it('returns 400 when login or password missing', async () => {
        const res = mockRes()
        await invoke(authController.authenticate, mockReq({body: {}}), res)
        expect(res.statusCode).toBe(400)
    })

    it('returns 401 for INVALID', async () => {
        serviceMock.authenticate.mockResolvedValueOnce('INVALID')
        const res = mockRes()
        await invoke(authController.authenticate, mockReq({body: {login: '10001', password: 'pw'}}), res)
        expect(res.statusCode).toBe(401)
    })

    it('returns 401 for DISABLED', async () => {
        serviceMock.authenticate.mockResolvedValueOnce('DISABLED')
        const res = mockRes()
        await invoke(authController.authenticate, mockReq({body: {login: '10001', password: 'pw'}}), res)
        expect(res.statusCode).toBe(401)
    })

    it('sets the jwtToken cookie and returns 200 on success', async () => {
        serviceMock.authenticate.mockResolvedValueOnce({token: 'tk', refreshToken: 'rt', user: {matricule: 10001}})
        const res = mockRes()
        await invoke(authController.authenticate, mockReq({body: {login: '10001', password: 'pw'}}), res)
        expect(res.statusCode).toBe(200)
        expect(res.cookies.jwtToken).toMatchObject({value: 'tk'})
    })
})

describe('authController.logout', () => {
    it('clears the jwtToken cookie', async () => {
        const res = mockRes()
        await invoke(authController.logout, mockReq(), res)
        expect(res.cookies.jwtToken).toMatchObject({value: ''})
    })
})

describe('authController.checkTokenValidity', () => {
    it('returns the service boolean', async () => {
        serviceMock.checkTokenValidity.mockReturnValueOnce(true)
        const res = mockRes()
        await invoke(authController.checkTokenValidity, mockReq({params: {token: 'x'}}), res)
        expect(res.body).toMatchObject({data: true})
    })
})

describe('authController.register', () => {
    it('returns 406 for missing fields', async () => {
        const res = mockRes()
        await invoke(authController.register, mockReq({body: {}}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 409 when service throws', async () => {
        serviceMock.register.mockRejectedValueOnce(new Error('dup'))
        const res = mockRes()
        await invoke(authController.register, mockReq({body: {matricule: 1, password: 'pw', firstName: 'A', lastName: 'B'}}), res)
        expect(res.statusCode).toBe(409)
    })

    it('sets cookie and returns 200 on success', async () => {
        serviceMock.register.mockResolvedValueOnce({token: 'tk', refreshToken: 'rt', user: {matricule: 1}})
        const res = mockRes()
        await invoke(authController.register, mockReq({body: {matricule: 1, password: 'pw', firstName: 'A', lastName: 'B'}}), res)
        expect(res.statusCode).toBe(200)
        expect(res.cookies.jwtToken).toMatchObject({value: 'tk'})
    })
})

describe('authController.registerMass', () => {
    it('returns 406 for empty body', async () => {
        const res = mockRes()
        await invoke(authController.registerMass, mockReq({body: []}), res)
        expect(res.statusCode).toBe(406)
    })

    it('returns 200 with the array of results', async () => {
        serviceMock.registerMass.mockResolvedValueOnce([{token: 'tk', user: {matricule: 1}}, null])
        const res = mockRes()
        await invoke(authController.registerMass, mockReq({body: [{matricule: 1}, {matricule: 2}]}), res)
        expect(res.statusCode).toBe(200)
    })
})

describe('authController.me', () => {
    it('returns 404 when no profile', async () => {
        serviceMock.getMe.mockResolvedValueOnce(null)
        const res = mockRes()
        await invoke(authController.me, mockReq({user: {matricule: 1} as never}), res)
        expect(res.statusCode).toBe(404)
    })

    it('returns 200 with the profile', async () => {
        serviceMock.getMe.mockResolvedValueOnce({matricule: 1, firstName: 'A'})
        const res = mockRes()
        await invoke(authController.me, mockReq({user: {matricule: 1} as never}), res)
        expect(res.statusCode).toBe(200)
        expect(res.body).toMatchObject({data: {matricule: 1}})
    })
})

describe('authController.microsoftLogin', () => {
    it('sets the state cookie and redirects to Azure', async () => {
        const res = mockRes()
        await invoke(authController.microsoftLogin, mockReq(), res)
        expect(res.cookies.ms_oauth_state).toBeDefined()
        expect(res.redirectedTo).toMatch(/login\.microsoftonline\.com/)
    })
})

describe('authController.microsoftCallback', () => {
    it('redirects with error param when authorize returned error', async () => {
        const res = mockRes()
        await invoke(authController.microsoftCallback, mockReq({query: {error: 'denied'}}), res)
        expect(res.redirectedTo).toMatch(/error=denied/)
    })

    it('redirects with ms_state when state does not match cookie', async () => {
        const res = mockRes()
        await invoke(
            authController.microsoftCallback,
            mockReq({query: {code: 'c', state: 'a'}, cookies: {ms_oauth_state: 'b'}}),
            res,
        )
        expect(res.redirectedTo).toMatch(/ms_state/)
    })
})
