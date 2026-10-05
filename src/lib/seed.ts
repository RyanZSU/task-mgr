import { useProjectStore } from '../stores/useProjectStore'
import { useTagStore } from '../stores/useTagStore'
import { useTaskStore } from '../stores/useTaskStore'

/**
 * Seed a small set of example data on the very first run only.
 * The persisted key `sp:task` is used as a canary — once any data exists we never seed again.
 */
export function maybeSeed() {
  try {
    if (localStorage.getItem('sp:task')) return
  } catch {
    return
  }

  const work = useProjectStore.getState().addProject({ title: 'Work', color: '#3f51b5', note: 'Job-related tasks' })
  const personal = useProjectStore.getState().addProject({ title: 'Personal', color: '#43a047' })

  const bug = useTagStore.getState().addTag({ title: 'bug', color: '#e53935' })
  const idea = useTagStore.getState().addTag({ title: 'idea', color: '#fb8c00' })

  const t1 = useTaskStore.getState().addTask({
    title: 'Welcome to your task manager 👋',
    notes: 'This app works fully offline. All data lives in your browser.\n\nTry the buttons below and explore the left menu — planner, tasks, board, worklog, metrics and the focus timer.',
    projectId: personal.id,
    tagIds: [idea.id],
    timeEstimateMs: 15 * 60_000,
    timeSpentMs: 5 * 60_000,
  })
  useTaskStore.getState().addTask({
    title: 'Try out the pomodoro timer',
    notes: 'Open the Focus view, pick a task and start a session.',
    projectId: personal.id,
    tagIds: [idea.id],
    timeEstimateMs: 25 * 60_000,
  })
  const t3 = useTaskStore.getState().addTask({
    title: 'Ship the quarterly report',
    notes: 'Summarize key metrics and outcomes.',
    projectId: work.id,
    tagIds: [],
    timeEstimateMs: 2 * 3600_000,
    timeSpentMs: 40 * 60_000,
  })
  useTaskStore.getState().addTask({
    title: 'Draft the outline',
    parentId: t3.id,
    projectId: work.id,
    tagIds: [],
    isDone: true,
    timeSpentMs: 20 * 60_000,
  })
  useTaskStore.getState().addTask({
    title: 'Fix login crash on mobile',
    notes: 'Reproduces when the app is backgrounded.',
    projectId: work.id,
    tagIds: [bug.id],
    timeEstimateMs: 45 * 60_000,
  })

  void t1
}