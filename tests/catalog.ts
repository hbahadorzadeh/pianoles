import { fileURLToPath } from 'node:url'
import { lessonFiles, loadCatalog } from '../src/lesson-files'

export const { lessons, units } = loadCatalog(lessonFiles(fileURLToPath(new URL('../lessons/', import.meta.url))))
