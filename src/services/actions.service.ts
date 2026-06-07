import {prisma} from '../db/prisma.js'
import {buildPage} from '../utils/pagination.js'
import {ProcessStatus} from '../enums.js'
import type {Prisma, Action} from '../generated/prisma/client.js'
import type {CreateActionRequest, MappedAction, UpdateActionRequest} from '../types.js'

function mapAction(t: Action, children: MappedAction[] | null = null, previous: MappedAction[] | null = null): MappedAction {
    return {
        id: t.id, site: t.site, anomalyRef: t.anomalyRef, correctiveAction: t.correctiveAction,
        responsible: t.idResponsible, startDate: t.startDate, dueDate: t.dueDate,
        status: t.status as ProcessStatus, progress: t.progress, childIndex: t.childIndex,
        children, previous, createdAt: t.createdAt, updatedAt: t.updatedAt,
    }
}

async function loadAction(id: string, visited = new Set<string>()): Promise<MappedAction | null> {
    if (visited.has(id)) return null
    visited.add(id)

    const action = await prisma.action.findUnique({where: {id}, include: {children: true, previousOf: true}})
    if (!action) return null

    const childSet = new Set(visited)
    const prevSet = new Set(visited)

    const childActions = action.children.length > 0
        ? (await Promise.all(action.children.map(tc => loadAction(tc.childrenId, new Set(childSet)))))
            .filter((t): t is MappedAction => t !== null)
            .sort((a, b) => {
                if (a.childIndex == null && b.childIndex == null) return 0
                if (a.childIndex == null) return 1
                if (b.childIndex == null) return -1
                return a.childIndex - b.childIndex
            })
        : null

    const prevActions = action.previousOf.length > 0
        ? (await Promise.all(action.previousOf.map(tp => loadAction(tp.previousId, new Set(prevSet)))))
            .filter((t): t is MappedAction => t !== null)
        : null

    return mapAction(
        action,
        childActions && childActions.length > 0 ? childActions : null,
        prevActions && prevActions.length > 0 ? prevActions : null,
    )
}

const defaultActionOrderBy: Prisma.ActionOrderByWithRelationInput[] = [
    {childIndex: {sort: 'asc', nulls: 'first'}},
    {createdAt: 'asc'},
]

function actionOrderBy(field: string, dir: 'asc' | 'desc'): Prisma.ActionOrderByWithRelationInput {
    switch (field) {
        case 'site':             return {site: dir}
        case 'anomalyRef':       return {anomalyRef: dir}
        case 'correctiveAction': return {correctiveAction: dir}
        case 'responsible':      return {responsible: {fullName: dir}}
        case 'dueDate':          return {dueDate: dir}
        case 'status':           return {status: dir}
        default:                 return {createdAt: 'asc'}
    }
}

async function paginatedActions(
    where: Prisma.ActionWhereInput,
    page: number, size: number, offset: number,
    sort?: {field: string; dir: 'asc' | 'desc'},
) {
    const orderBy = sort ? actionOrderBy(sort.field, sort.dir) : defaultActionOrderBy
    const [total, items] = await prisma.$transaction([
        prisma.action.count({where}),
        prisma.action.findMany({where, orderBy, skip: offset, take: size}),
    ])
    return {total, page: buildPage(items.map(t => mapAction(t)), total, page, size)}
}

export interface ActionFilters {
    site?: string
    anomalyRef?: string
    correctiveAction?: string
    responsible?: string
    status?: string
    dueDate?: Date
    dueDateAfter?: Date
    dueDateBefore?: Date
}

function buildWhere(f: ActionFilters): Prisma.ActionWhereInput {
    const where: Prisma.ActionWhereInput = {}
    if (f.site) where.site = {contains: f.site, mode: 'insensitive'}
    if (f.anomalyRef) where.anomalyRef = {contains: f.anomalyRef, mode: 'insensitive'}
    if (f.correctiveAction) where.correctiveAction = {contains: f.correctiveAction, mode: 'insensitive'}
    if (f.responsible) where.responsible = {fullName: {contains: f.responsible, mode: 'insensitive'}}
    if (f.status) where.status = f.status
    if (f.dueDateAfter || f.dueDateBefore) {
        where.dueDate = {...(f.dueDateAfter ? {gte: f.dueDateAfter} : {}), ...(f.dueDateBefore ? {lte: f.dueDateBefore} : {})}
    } else if (f.dueDate) {
        const nextDay = new Date(f.dueDate)
        nextDay.setDate(nextDay.getDate() + 1)
        where.dueDate = {gte: f.dueDate, lt: nextDay}
    }
    return where
}

export const actionsService = {
    async create(b: CreateActionRequest): Promise<MappedAction> {
        const action = await prisma.action.create({
            data: {
                site: b.site ?? null, anomalyRef: b.anomalyRef ?? null,
                correctiveAction: b.correctiveAction ?? null, idResponsible: b.responsible!,
                startDate: b.startDate ? new Date(b.startDate) : null,
                dueDate: b.dueDate ? new Date(b.dueDate) : null,
                status: b.status ?? ProcessStatus.INITIALIZED,
            },
        })
        return (await loadAction(action.id))!
    },

    async addChild(actionId: string, b: CreateActionRequest): Promise<MappedAction | null> {
        const parent = await prisma.action.findUnique({where: {id: actionId}, select: {id: true}})
        if (!parent) return null
        const childIndex = await prisma.actionChild.count({where: {actionId}})
        await prisma.action.create({
            data: {
                site: b.site ?? null, anomalyRef: b.anomalyRef ?? null,
                correctiveAction: b.correctiveAction ?? null, idResponsible: b.responsible!,
                startDate: b.startDate ? new Date(b.startDate) : null,
                dueDate: b.dueDate ? new Date(b.dueDate) : null,
                status: b.status ?? ProcessStatus.INITIALIZED, childIndex,
                childOf: {create: {actionId}},
            },
        })
        return loadAction(actionId)
    },

    async addChildren(actionId: string, items: CreateActionRequest[]): Promise<MappedAction | null> {
        const parent = await prisma.action.findUnique({where: {id: actionId}, select: {id: true}})
        if (!parent) return null
        let childIndex = await prisma.actionChild.count({where: {actionId}})
        for (const b of items) {
            if (!b.responsible) continue
            await prisma.action.create({
                data: {
                    site: b.site ?? null, anomalyRef: b.anomalyRef ?? null,
                    correctiveAction: b.correctiveAction ?? null, idResponsible: b.responsible!,
                    startDate: b.startDate ? new Date(b.startDate) : null,
                    dueDate: b.dueDate ? new Date(b.dueDate) : null,
                    status: b.status ?? ProcessStatus.INITIALIZED, childIndex: childIndex++,
                    childOf: {create: {actionId}},
                },
            })
        }
        return loadAction(actionId)
    },

    findById: (id: string) => loadAction(id),

    findAll: (filters: ActionFilters, page: number, size: number, offset: number, sort?: {field: string; dir: 'asc' | 'desc'}) =>
        paginatedActions(buildWhere(filters), page, size, offset, sort),

    async update(id: string, b: UpdateActionRequest): Promise<MappedAction | 'NOT_FOUND'> {
        try {
            await prisma.action.update({
                where: {id},
                data: {
                    site: b.site ?? undefined, anomalyRef: b.anomalyRef ?? undefined,
                    correctiveAction: b.correctiveAction ?? undefined,
                    idResponsible: b.responsible ?? undefined,
                    dueDate: b.dueDate ? new Date(b.dueDate) : undefined,
                    status: b.status ?? undefined, updatedAt: new Date(),
                },
            })
            return (await loadAction(id))!
        } catch (e: unknown) {
            if ((e as { code?: string })?.code === 'P2025') return 'NOT_FOUND'
            throw e
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.action.delete({where: {id}})
            return true
        } catch {
            return false
        }
    },
}