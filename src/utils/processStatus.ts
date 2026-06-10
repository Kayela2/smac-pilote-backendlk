import {ProcessStatusEnum} from '../generated/prisma/enums.js'
import {ProcessStatus} from '../enums.js'
const PS_TO_ENUM: Record<string, ProcessStatusEnum> = {
    [ProcessStatus.PLANNED]:     ProcessStatusEnum.Planifie,
    [ProcessStatus.INITIALIZED]: ProcessStatusEnum.Initialise,
    [ProcessStatus.IN_PROGRESS]: ProcessStatusEnum.EnCours,
    [ProcessStatus.PENDING]:     ProcessStatusEnum.EnAttente,
    [ProcessStatus.NOT_STARTED]: ProcessStatusEnum.PasCommence,
    [ProcessStatus.COMPLETE]:    ProcessStatusEnum.Termine,
    [ProcessStatus.TRAITE]:      ProcessStatusEnum.Traite,
    [ProcessStatus.CANCELED]:    ProcessStatusEnum.Annule,
    [ProcessStatus.ACCEPTED]:    ProcessStatusEnum.Accepte,
    [ProcessStatus.REFUSED]:     ProcessStatusEnum.Refuse,
    [ProcessStatus.BLOQUE]:      ProcessStatusEnum.Bloque,
    [ProcessStatus.A_FAIRE]:     ProcessStatusEnum.AFaire,
}

const ENUM_TO_PS: Record<ProcessStatusEnum, string> = {
    [ProcessStatusEnum.Planifie]:    ProcessStatus.PLANNED,
    [ProcessStatusEnum.Initialise]:  ProcessStatus.INITIALIZED,
    [ProcessStatusEnum.EnCours]:     ProcessStatus.IN_PROGRESS,
    [ProcessStatusEnum.EnAttente]:   ProcessStatus.PENDING,
    [ProcessStatusEnum.PasCommence]: ProcessStatus.NOT_STARTED,
    [ProcessStatusEnum.Termine]:     ProcessStatus.COMPLETE,
    [ProcessStatusEnum.Traite]:      ProcessStatus.TRAITE,
    [ProcessStatusEnum.Annule]:      ProcessStatus.CANCELED,
    [ProcessStatusEnum.Accepte]:     ProcessStatus.ACCEPTED,
    [ProcessStatusEnum.Refuse]:      ProcessStatus.REFUSED,
    [ProcessStatusEnum.Bloque]:      ProcessStatus.BLOQUE,
    [ProcessStatusEnum.AFaire]:      ProcessStatus.A_FAIRE,
}
export const psToEnum = (s: string): ProcessStatusEnum => PS_TO_ENUM[s] ?? ProcessStatusEnum.Initialise
export const enumToPs = (e: ProcessStatusEnum): string => ENUM_TO_PS[e] ?? ProcessStatus.INITIALIZED
