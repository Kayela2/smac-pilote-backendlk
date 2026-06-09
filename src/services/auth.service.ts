import bcrypt from 'bcryptjs'
import {randomUUID} from 'node:crypto'
import jwt, {type SignOptions} from 'jsonwebtoken'
import {prisma} from '../db/prisma.js'
import {config} from '../config.js'
import {Role} from '../enums.js'
import type {RegisterRequest, UserProfile, UserWithRelations} from '../types.js'

const userInclude = {
    person: {include: {etablissement: {include: {agence: true}}}},
    photo: true,
} as const

export type AuthResult = { token: string; refreshToken: string; user: UserProfile }

function signToken(payload: object, expires: number): string {
    const opts: SignOptions = {expiresIn: Math.floor(expires)}
    return jwt.sign(payload, config.jwtSecret, opts)
}

function buildProfile(user: UserWithRelations): UserProfile {
    const etab = user.person?.etablissement ?? null
    return {
        role: user.role,
        matricule: user.matricule,
        lastName: user.person?.lastName ?? '',
        firstName: user.person?.firstName ?? '',
        profilePicture: user.photo?.profilePicture ?? null,
        etablissement: etab ? {id: etab.id, adresse1: etab.adresse1, codeSap: etab.codeSap} : null,
        agence: etab?.agence ? {id: etab.agence.id, codeAgence: etab.agence.codeAgence, nomAgence: etab.agence.nomAgence} : null,
    }
}

function buildTokens(user: UserWithRelations): AuthResult {
    const token = signToken({id: user.id, matricule: user.matricule, role: user.role}, config.jwtExpires)
    const refreshToken = signToken({id: user.id, type: 'refresh'}, config.refreshExpires)
    return {token, refreshToken, user: buildProfile(user)}
}

export const authService = {
    signToken,

    checkTokenValidity(token: string): boolean {
        try {
            jwt.verify(token, config.jwtSecret)
            return true
        } catch {
            return false
        }
    },

    async authenticate(login: string, password: string): Promise<AuthResult | 'INVALID' | 'DISABLED'> {
        const matricule = Number(login)
        if (!Number.isFinite(matricule)) return 'INVALID'

        const user = await prisma.user.findUnique({where: {matricule}, include: userInclude})
        if (!user || !(await bcrypt.compare(String(password), user.password))) return 'INVALID'
        if (!user.enabled || user.locked) return 'DISABLED'

        return buildTokens(user as unknown as UserWithRelations)
    },

    async register(body: RegisterRequest): Promise<AuthResult> {
        const hash = await bcrypt.hash(body.password!, 10)
        const user = await prisma.user.create({
            data: {
                matricule: body.matricule!,
                password: hash,
                role: body.role ?? Role.USER,
                person: {create: {lastName: body.lastName!, firstName: body.firstName}},
            },
            include: userInclude,
        })
        return buildTokens(user as unknown as UserWithRelations)
    },

    async registerMass(requests: RegisterRequest[]): Promise<Array<AuthResult | null>> {
        const results: Array<AuthResult | null> = []
        for (const body of requests) {
            if (!body.matricule || !body.password || !body.firstName || !body.lastName) continue
            try {
                results.push(await authService.register(body))
            } catch {
                results.push(null)
            }
        }
        return results
    },

    async getMe(matricule: number): Promise<UserProfile | null> {
        const user = await prisma.user.findUnique({where: {matricule}, include: userInclude})
        return user ? buildProfile(user as unknown as UserWithRelations) : null
    },

    async findOrCreateMicrosoftUser(employeeId: number, microsoftId: string, email: string, firstName: string, lastName: string): Promise<AuthResult> {
        const normalizedEmail = email.trim().toLowerCase() || null

        let user = await prisma.user.findUnique({where: {microsoftId}, include: userInclude})

        if (!user && normalizedEmail) {
            const existing = await prisma.user.findUnique({where: {email: normalizedEmail}, include: userInclude})
            if (existing) {
                user = await prisma.user.update({
                    where: {id: existing.id},
                    data: {microsoftId},
                    include: userInclude,
                })
            }
        }

        if (!user) {
            user = await prisma.user.create({
                data: {
                    matricule: employeeId,
                    password: await bcrypt.hash(randomUUID(), 10),
                    role: Role.USER,
                    email: normalizedEmail,
                    microsoftId,
                    person: {create: {lastName: lastName || 'Unknown', firstName: firstName || null}},
                },
                include: userInclude,
            })
        }
        return buildTokens(user as unknown as UserWithRelations)
    },
}