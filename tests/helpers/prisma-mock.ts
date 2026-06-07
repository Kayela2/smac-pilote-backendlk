import {vi} from 'vitest'

type ModelFns =
    | 'findUnique' | 'findFirst' | 'findMany' | 'count' | 'aggregate'
    | 'create' | 'update' | 'delete' | 'upsert'
    | 'createMany' | 'updateMany' | 'deleteMany'

function makeModel(): Record<ModelFns, ReturnType<typeof vi.fn>> {
    return {
        findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
        count: vi.fn(), aggregate: vi.fn(),
        create: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn(),
        createMany: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(),
    }
}

export const prismaMock = {
    chantier: makeModel(),
    chantierDetails: makeModel(),
    chantierAction: makeModel(),
    actionChild: makeModel(),
    actionPrevious: makeModel(),
    chantierIntervenant: makeModel(),
    chantierDocumentation: makeModel(),
    action: makeModel(),
    intervenant: makeModel(),
    intervention: makeModel(),
    fiche: makeModel(),
    folder: makeModel(),
    chantierRequiredDoc: makeModel(),
    chantierSharedDoc: makeModel(),
    user: makeModel(),
    person: makeModel(),
    userPhoto: makeModel(),
    requestLog: makeModel(),
    $transaction: vi.fn(async (calls: Promise<unknown>[]) => Promise.all(calls)),
}

export function resetPrismaMock() {
    for (const model of Object.values(prismaMock)) {
        if (typeof model === 'function') continue
        for (const fn of Object.values(model)) (fn as ReturnType<typeof vi.fn>).mockReset()
    }
    prismaMock.$transaction.mockReset()
    prismaMock.$transaction.mockImplementation(async (calls: Promise<unknown>[]) => Promise.all(calls))
}
