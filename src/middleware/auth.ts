/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import type {NextFunction, Request, Response} from 'express'
import jwt from 'jsonwebtoken'
import {config} from '../config.js'
import {Role} from '../enums.js'
import {fail} from '../utils/response.js'

export interface AuthUser {
    id: string
    matricule: number
    role: Role
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

/** Extract bearer token from Authorization header or jwtToken cookie. */
function extractToken(req: Request): string | null {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) return header.slice(7)
    const cookies = req.cookies as Record<string, string> | undefined
    return cookies?.jwtToken ?? null
}

/** Reject requests without a valid JWT (header or cookie). */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const token = extractToken(req)
    if (!token) {
        res.status(401).json(fail('Authentification requise'))
        return
    }
    try {
        const payload = jwt.verify(token, config.jwtSecret) as AuthUser
        req.user = {id: payload.id, matricule: payload.matricule, role: payload.role}
        next()
    } catch {
        res.status(401).json(fail('Session expirée ou invalide'))
    }
}
