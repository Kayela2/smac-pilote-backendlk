import {type Request, type RequestHandler, type Response} from 'express'
import {authService} from '../services/auth.service.js'
import {config} from '../config.js'
import {fail, ok} from '../utils/response.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import type {AuthenticateRequest, RegisterRequest} from '../types.js'

function setCookie(res: Response, token: string): void {
    res.cookie('jwtToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: config.jwtExpires,
        path: '/',
    })
}

function clearCookie(res: Response): void {
    res.cookie('jwtToken', '', {httpOnly: true, maxAge: 0, path: '/'})
}

export const authController = {
    authenticate: asyncHandler(async (req, res) => {
        const {login, password} = (req.body ?? {}) as AuthenticateRequest
        if (!login || !password) {
            res.status(400).json(fail('Invalid login or password')); return
        }
        const result = await authService.authenticate(String(login), password)
        if (result === 'INVALID') { res.status(401).json(fail('Invalid login or password')); return }
        if (result === 'DISABLED') { res.status(401).json(fail('Account disabled or locked')); return }
        setCookie(res, result.token)
        res.json(ok(result, 'Login successful'))
    }),

    logout: ((_req: Request, res: Response) => {
        clearCookie(res)
        res.json(ok(null, 'Logged out successful'))
    }) as RequestHandler,

    checkTokenValidity: asyncHandler(async (req, res) => {
        try {
            res.json(ok(authService.checkTokenValidity(req.params.token), 'Token Valid'))
        } catch {
            res.status(401).json(fail('Token invalid or expired'))
        }
    }),

    register: asyncHandler(async (req, res) => {
        const body = (req.body ?? {}) as RegisterRequest
        if (!body.matricule || !body.password || !body.firstName || !body.lastName) {
            res.status(406).json(fail('Invalid entries!')); return
        }
        try {
            const result = await authService.register(body)
            setCookie(res, result.token)
            res.json(ok(result, 'User registered successfully'))
        } catch {
            res.status(409).json(fail('User already exists'))
        }
    }),

    registerMass: asyncHandler(async (req, res) => {
        const requests = req.body as RegisterRequest[]
        if (!Array.isArray(requests) || requests.length === 0) {
            res.status(406).json(fail('Invalid entries!')); return
        }
        res.json(ok(await authService.registerMass(requests), 'Users registered successfully'))
    }),

    me: asyncHandler(async (req, res) => {
        const profile = await authService.getMe(req.user!.matricule)
        if (!profile) { res.status(404).json(fail('Not found')); return }
        res.json(ok(profile, 'My PROFILE User'))
    }),

    microsoftLogin: ((_req: Request, res: Response) => {
        const state = crypto.randomUUID()
        res.cookie('ms_oauth_state', state, {httpOnly: true, maxAge: 5 * 60 * 1000, sameSite: 'lax', path: '/'})
        const params = new URLSearchParams({
            client_id: config.azure.clientId,
            response_type: 'code',
            redirect_uri: config.azure.redirectUri,
            scope: 'openid profile email User.Read',
            state,
            response_mode: 'query'
        })
        res.redirect(`https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/authorize?${params}`)
    }) as RequestHandler,

    microsoftCallback: asyncHandler(async (req, res) => {
        const {code, state, error, error_description} = req.query as Record<string, string | undefined>

        if (error) {
            console.error('[MS OAuth] authorize error:', error, '-', error_description)
            res.redirect(`${config.clientUrl}/authentication/signin?error=${encodeURIComponent(error)}&desc=${encodeURIComponent(error_description ?? '')}`)
            return
        }
        if (!code || !state || state !== req.cookies?.ms_oauth_state) {
            res.redirect(`${config.clientUrl}/authentication/signin?error=ms_state`); return
        }
        res.clearCookie('ms_oauth_state', {path: '/'})

        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    client_id: config.azure.clientId,
                    client_secret: config.azure.clientSecret,
                    code,
                    redirect_uri: config.azure.redirectUri,
                    grant_type: 'authorization_code',
                }),
            },
        )
        if (!tokenRes.ok) {
            console.error('[MS OAuth] token exchange failed:', tokenRes.status, await tokenRes.text())
            res.redirect(`${config.clientUrl}/authentication/signin?error=ms_token`); return
        }

        const {access_token} = await tokenRes.json() as {access_token: string}

        const profileRes = await fetch('https://graph.microsoft.com/beta/me', {
            headers: {Authorization: `Bearer ${access_token}`},
        })
        if (!profileRes.ok) { res.redirect(`${config.clientUrl}/authentication/signin?error=ms_profile`); return }

        const msProfile = await profileRes.json() as {
            id: string; givenName?: string; surname?: string; employeeId: number;
            mail?: string; userPrincipalName?: string
        }

        const result = await authService.findOrCreateMicrosoftUser(
            Number(msProfile.employeeId),
            msProfile.id,
            msProfile.mail ?? msProfile.userPrincipalName ?? '',
            msProfile.givenName ?? '',
            msProfile.surname ?? '',
        )

        setCookie(res, result.token)
        const payload = Buffer.from(JSON.stringify(result)).toString('base64url')
        res.redirect(`${config.clientUrl}/auth/ms-callback?data=${payload}`)
    }),
}
