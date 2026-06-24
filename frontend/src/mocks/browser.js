/**
 * Service worker do MSW para o navegador (modo de desenvolvimento).
 *
 * Iniciado em src/main.js apenas quando VITE_MOCK_API está ligado, então
 * não tem nenhum efeito no build de produção.
 */
import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
