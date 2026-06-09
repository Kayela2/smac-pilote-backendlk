/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import type {Request} from 'express'
import {Page} from "../types.js";

export function getPagination(req: Request): { page: number; size: number; offset: number } {
    const page = Math.max(0, Number(req.query.page) || 0)
    const size = Math.min(100, Math.max(1, Number(req.query.size) || 20))
    return {page, size, offset: page * size}
}

export function getSort(req: Request): { field: string; dir: 'asc' | 'desc' } {
    const raw = (typeof req.query.sort === 'string' ? req.query.sort : '').trim()
    const comma = raw.indexOf(',')
    const field = comma > 0 ? raw.slice(0, comma).trim() : raw
    const dir = raw.slice(comma + 1).trim() === 'desc' ? 'desc' : 'asc'
    return {field, dir}
}

export function buildPage<T>(rows: T[], total: number, page: number, size: number): Page<T> {
    return {
        content: rows,
        totalElements: total,
        totalPages: Math.ceil(total / size),
        size,
        page
    }
}
