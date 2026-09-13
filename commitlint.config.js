/**
 * Conventional Commits. El scope es opcional, pero cuando se usa conviene que sea la
 * rebanada de FSD que se tocó: `feat(entities/lote):`, `fix(features/aplicar-venta):`.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
