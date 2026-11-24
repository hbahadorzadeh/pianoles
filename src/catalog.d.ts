declare module 'virtual:lesson-catalog' {
  export const units: import('./lessons').LessonUnit[]
  export const lessons: import('./lessons').CatalogLesson[]
}
