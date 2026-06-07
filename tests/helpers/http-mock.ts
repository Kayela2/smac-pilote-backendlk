import {vi} from 'vitest'
import type {Request, Response} from 'express'

export type MockRes = {
    statusCode: number
    body: unknown
    ended: boolean
    redirectedTo?: string
    cookies: Record<string, {value: string; options?: unknown}>
    clearedCookies: string[]
    headers: Record<string, string>
    // Express method stubs
    status: (code: number) => MockRes
    json: (payload: unknown) => MockRes
    end: () => MockRes
    redirect: (to: string) => MockRes
    cookie: (name: string, value: string, options?: unknown) => MockRes
    clearCookie: (name: string) => MockRes
    setHeader: (name: string, value: string | number | readonly string[]) => MockRes
    pipe?: (dest: unknown) => unknown
}

export function mockReq(overrides: Partial<Request> = {}): Request {
    return {body: undefined, params: {}, query: {}, headers: {}, cookies: {}, ...overrides} as unknown as Request
}

export function mockRes(): MockRes {
    const res = {
        statusCode: 200,
        body: undefined,
        ended: false,
        cookies: {} as MockRes['cookies'],
        clearedCookies: [] as string[],
        headers: {} as Record<string, string>,
    } as MockRes
    res.status = vi.fn((code: number) => { res.statusCode = code; return res })
    res.json = vi.fn((payload: unknown) => { res.body = payload; return res })
    res.end = vi.fn(() => { res.ended = true; return res })
    res.redirect = vi.fn((to: string) => { res.redirectedTo = to; return res })
    res.cookie = vi.fn((name: string, value: string, options?: unknown) => {
        res.cookies[name] = {value, options}
        return res
    })
    res.clearCookie = vi.fn((name: string) => { res.clearedCookies.push(name); return res })
    res.setHeader = vi.fn((name: string, value: string | number | readonly string[]) => {
        res.headers[name] = String(value)
        return res
    })
    return res
}

export async function invoke(
    handler: (req: Request, res: Response, next: (err?: unknown) => void) => unknown,
    req: Request,
    res: MockRes,
) {
    let nextErr: unknown
    await handler(req, res as unknown as Response, (err?: unknown) => { nextErr = err })
    if (nextErr) throw nextErr
}
