import {defineConfig} from 'vitest/config'

export default defineConfig({
    esbuild: {
        tsconfigRaw: {compilerOptions: {module: 'NodeNext' as never, target: 'ES2022'}},
    },
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
        globals: false,
        clearMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/services/**/*.ts', 'src/controllers/**/*.ts'],
        },
    },
})
