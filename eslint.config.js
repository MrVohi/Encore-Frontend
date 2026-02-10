import { tanstackConfig } from '@tanstack/eslint-config'

export default [
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'eslint.config.js',
            'prettier.config.js',
            'vite.config.ts',
        ],
    },
    ...tanstackConfig,

    // Temporary overrides to avoid turning this branch into a massive refactor.
    {
        rules: {
            // Too noisy right now; often flags “always truthy/falsy” due to TS inference.
            '@typescript-eslint/no-unnecessary-condition': 'off',

            // Style preference; not worth fixing everywhere for prod-prep.
            '@typescript-eslint/array-type': 'off',

            'import/order': 'warn',
            'sort-imports': 'warn',

            // Type-import nitpicks → can be re-enabled later.
            'import/consistent-type-specifier-style': 'off',
        },
    },
]
