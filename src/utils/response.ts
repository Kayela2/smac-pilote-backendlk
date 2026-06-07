/*
 * Copyright (c) 2026, Bruno NDUWARUGIRA. | GitHub Name: nduwarugirabruno
 */

import {MessageType} from '../enums.js'
import type {ApiResponse} from '../types.js'

/** Build a SUCCESS envelope. */
export function ok<T>(data: T, message = 'OK'): ApiResponse<T> {
    return {data, message, type: MessageType.SUCCESS}
}

/** Build an ERROR envelope (data is always null). */
export function fail(message: string): ApiResponse<null> {
    return {data: null, message, type: MessageType.ERROR}
}
