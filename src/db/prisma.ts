/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import 'dotenv/config'
import {PrismaClient} from '../generated/prisma/client.js'
import {PrismaPg} from '@prisma/adapter-pg'
import {pool} from './pool.js'

const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({
    adapter,
    log: process.env.MODE_ENV === 'development' ? ['query', 'error', 'info', 'warn'] : ['error', 'warn']
})
