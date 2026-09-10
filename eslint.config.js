import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier'

/**
 * Capas de Feature-Sliced Design, de arriba hacia abajo.
 *
 * Una capa solo puede importar de las que están por debajo, nunca de las de arriba ni de
 * otra rebanada de su misma capa, y siempre por la API pública (`index.ts`) de la rebanada.
 * Esto no es una convención escrita en el README: lo revienta el linter, y el linter corre
 * en el pre-commit.
 */
const CAPAS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

const capasDebajo = (capa) => CAPAS.slice(CAPAS.indexOf(capa) + 1)

/** Otra rebanada solo se toca por su índice: nada de entrar a sus archivos internos. */
const porApiPublica = (capa) => ({
  to: {
    element:
      capa === 'shared'
        ? // `shared` se importa por segmento (`@/shared/ui`, `@/shared/api/db`): no tiene
          // una sola puerta, cada segmento es la suya.
          { type: 'shared' }
        : { type: capa, fileInternalPath: 'index.{ts,tsx}' },
  },
})

/** Dentro de la misma rebanada todo es interno y puede importarse libremente. */
const mismaRebanada = (capa) => ({
  to: {
    element:
      capa === 'app'
        ? { type: 'app' }
        : { type: capa, capturedValues: { slice: '{{from.element.capturedValues.slice}}' } },
  },
})

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages/*', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['slice'] },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: 'FSD: {{file.type}} no puede importar de {{dependency.type}}.',
          policies: CAPAS.map((capa) => ({
            from: [{ element: { type: capa } }],
            allow: [mismaRebanada(capa), ...capasDebajo(capa).map(porApiPublica)],
          })),
        },
      ],
    },
  },

  // Las pruebas entran a los internos de la rebanada que están probando.
  {
    files: ['**/*.test.{ts,tsx}', 'src/shared/test/**'],
    rules: { 'boundaries/dependencies': 'off' },
  },

  {
    files: ['**/*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },

  prettier,
)
