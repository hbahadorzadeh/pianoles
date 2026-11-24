import { resolve } from 'node:path'
import { defineConfig, normalizePath, type Plugin } from 'vite'
import { lessonFiles, loadCatalog } from './src/lesson-files'

function lessonCatalog(): Plugin {
  const directory = normalizePath(resolve('lessons'))
  const publicId = 'virtual:lesson-catalog'
  const moduleId = '\0' + publicId
  return {
    name: 'pianoles-lesson-catalog',
    resolveId(id) {
      if (id === publicId) return moduleId
    },
    load(id) {
      if (id !== moduleId) return
      const files = lessonFiles(directory)
      for (const file of files) this.addWatchFile(file)
      const { units } = loadCatalog(files)
      return `export const units = ${JSON.stringify(units)};
export const lessons = units.flatMap(unit => unit.lessons);`
    },
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        const path = normalizePath(file)
        if (!path.startsWith(directory + '/') || !path.endsWith('/lesson.yaml')) return
        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

export default defineConfig({ base: '/pianoles/', plugins: [lessonCatalog()] })
