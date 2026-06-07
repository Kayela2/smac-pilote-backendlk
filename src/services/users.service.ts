import bcrypt from 'bcryptjs'
import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import {Gender, Role} from '../enums.js'
import type {UpdatePasswordRequest, UpdateProfileRequest} from '../types.js'

const userInclude = {person: true, photo: true} as const
const omitPassword = {password: true} as const

type RawUser = {
    id: string; matricule: number; role: string; phone: string | null;
    enabled: boolean; locked: boolean; createdAt: Date; updatedAt: Date;
    person: { lastName: string; firstName: string | null; gender: string | null } | null;
    photo: { profilePicture: string | null } | null;
}

function mapUser(u: RawUser) {
    return {
        id: u.id, matricule: u.matricule, role: u.role as Role, phone: u.phone,
        enabled: u.enabled, locked: u.locked,
        firstName: u.person?.firstName ?? null, lastName: u.person?.lastName ?? null,
        gender: (u.person?.gender ?? null) as Gender | null, profilePicture: u.photo?.profilePicture ?? null,
        createdAt: u.createdAt, updatedAt: u.updatedAt,
    }
}

function userOrderBy(field: string, dir: 'asc' | 'desc') {
    switch (field) {
        case 'matricule': return {matricule: dir} as const
        case 'firstName': return {person: {firstName: dir}} as const
        case 'lastName':  return {person: {lastName: dir}} as const
        case 'role':      return {role: dir} as const
        default:          return {matricule: 'asc'} as const
    }
}

export interface UserFilters {
    matricule?: number
}

function buildWhere(f: UserFilters) {
    const where: {matricule?: number} = {}
    if (f.matricule !== undefined) where.matricule = f.matricule
    return where
}

export const usersService = {
    async findAll(filters: UserFilters, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) {
        const orderBy = sort?.field ? userOrderBy(sort.field, sort.dir) : {matricule: 'asc' as const}
        const where = buildWhere(filters)
        const [total, users] = await prisma.$transaction([
            prisma.user.count({where}),
            prisma.user.findMany({where, omit: omitPassword, include: userInclude, orderBy, skip: offset, take: size}),
        ])
        return buildPage(users.map(mapUser), total, page, size)
    },

    async findById(id: string) {
        const user = await prisma.user.findUnique({where: {id}, omit: omitPassword, include: userInclude})
        return user ? mapUser(user) : null
    },

    async updateProfile(id: string, body: UpdateProfileRequest) {
        const user = await prisma.user.update({
            where: {id},
            data: {
                updatedAt: new Date(),
                person: {update: {firstName: body.firstName ?? undefined, lastName: body.lastName ?? undefined}},
            },
            omit: omitPassword,
            include: userInclude,
        })
        return mapUser(user)
    },

    async updatePassword(id: string, body: UpdatePasswordRequest): Promise<'WRONG_PASSWORD' | ReturnType<typeof mapUser>> {
        const user = await prisma.user.findUnique({where: {id}})
        if (!user || !(await bcrypt.compare(body.oldPassword, user.password))) return 'WRONG_PASSWORD'
        const updated = await prisma.user.update({
            where: {id},
            data: {password: await bcrypt.hash(body.newPassword, 10), updatedAt: new Date()},
            omit: omitPassword,
            include: userInclude,
        })
        return mapUser(updated)
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.user.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },

    async lock(id: string): Promise<boolean> {
        try {
            await prisma.user.update({where: {id}, data: {locked: true, updatedAt: new Date()}})
            return true
        } catch {
            return false
        }
    },

    async savePhoto(id: string, filePath: string) {
        const user = await prisma.user.findUnique({where: {id}, omit: omitPassword})
        if (!user) return null
        await prisma.userPhoto.upsert({
            where: {id},
            create: {id, matricule: user.matricule, profilePicture: filePath},
            update: {profilePicture: filePath, updatedAt: new Date()},
        })
        return filePath
    },

    async getPhoto(id: string) {
        const photo = await prisma.userPhoto.findFirst({
            where: {OR: [{id}, {matricule: Number(id) || undefined}]},
        })
        return photo ? {profilePicture: photo.profilePicture} : null
    },
}