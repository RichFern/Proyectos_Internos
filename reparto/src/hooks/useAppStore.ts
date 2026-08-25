import { useCallback, useEffect, useState } from 'react'
import type { AppData, Expense, ExpenseTemplate, Member, Space } from '../types'
import { MEMBER_COLORS } from '../types'
import { createId } from '../lib/id'
import { loadData, saveData, resetDemoData } from '../lib/storage'

export function useAppStore() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const data = loadData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveData({ spaces, activeSpaceId })
  }, [spaces, activeSpaceId, ready])

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? null

  const createSpace = useCallback(
    (input: Pick<Space, 'name' | 'description' | 'kind'>) => {
      const now = new Date().toISOString()
      const space: Space = {
        id: createId(),
        ...input,
        members: [],
        expenses: [],
        templates: [],
        createdAt: now,
        updatedAt: now,
      }
      setSpaces((prev) => [space, ...prev])
      setActiveSpaceId(space.id)
      return space
    },
    [],
  )

  const updateSpace = useCallback((id: string, patch: Partial<Space>) => {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
      ),
    )
  }, [])

  const deleteSpace = useCallback(
    (id: string) => {
      setSpaces((prev) => {
        const next = prev.filter((s) => s.id !== id)
        if (activeSpaceId === id) {
          setActiveSpaceId(next[0]?.id ?? null)
        }
        return next
      })
    },
    [activeSpaceId],
  )

  const addMember = useCallback(
    (spaceId: string, input: Pick<Member, 'name' | 'income'>) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          const color = MEMBER_COLORS[s.members.length % MEMBER_COLORS.length]
          const member: Member = {
            id: createId(),
            ...input,
            color,
            createdAt: new Date().toISOString(),
          }
          return {
            ...s,
            members: [...s.members, member],
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const updateMember = useCallback(
    (spaceId: string, memberId: string, patch: Partial<Member>) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          return {
            ...s,
            members: s.members.map((m) =>
              m.id === memberId ? { ...m, ...patch } : m,
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const removeMember = useCallback((spaceId: string, memberId: string) => {
    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== spaceId) return s
        return {
          ...s,
          members: s.members.filter((m) => m.id !== memberId),
          expenses: s.expenses.filter((e) => e.paidById !== memberId),
          templates: s.templates.filter((t) => t.paidById !== memberId),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const addExpense = useCallback(
    (spaceId: string, input: Omit<Expense, 'id' | 'createdAt'>) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          const expense: Expense = {
            ...input,
            id: createId(),
            createdAt: new Date().toISOString(),
          }
          return {
            ...s,
            expenses: [expense, ...s.expenses],
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const updateExpense = useCallback(
    (spaceId: string, expenseId: string, patch: Partial<Expense>) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          return {
            ...s,
            expenses: s.expenses.map((e) =>
              e.id === expenseId ? { ...e, ...patch } : e,
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const removeExpense = useCallback((spaceId: string, expenseId: string) => {
    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== spaceId) return s
        return {
          ...s,
          expenses: s.expenses.filter((e) => e.id !== expenseId),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const addTemplate = useCallback(
    (
      spaceId: string,
      input: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      const now = new Date().toISOString()
      let createdId = ''
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          const existing = s.templates.find(
            (t) =>
              t.description.trim().toLowerCase() === input.description.trim().toLowerCase() &&
              t.category === input.category,
          )
          if (existing) {
            createdId = existing.id
            return {
              ...s,
              templates: s.templates.map((t) =>
                t.id === existing.id
                  ? { ...t, ...input, updatedAt: now }
                  : t,
              ),
              updatedAt: now,
            }
          }
          const template: ExpenseTemplate = {
            ...input,
            id: createId(),
            createdAt: now,
            updatedAt: now,
          }
          createdId = template.id
          return {
            ...s,
            templates: [template, ...s.templates],
            updatedAt: now,
          }
        }),
      )
      return createdId
    },
    [],
  )

  const removeTemplate = useCallback((spaceId: string, templateId: string) => {
    setSpaces((prev) =>
      prev.map((s) => {
        if (s.id !== spaceId) return s
        return {
          ...s,
          templates: s.templates.filter((t) => t.id !== templateId),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const resetDemo = useCallback(() => {
    const data = resetDemoData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
  }, [])

  const reloadFromStorage = useCallback(() => {
    const data = loadData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
  }, [])

  const replaceAllData = useCallback((data: AppData) => {
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    saveData(data)
  }, [])

  const getSnapshot = useCallback(
    (): AppData => ({ spaces, activeSpaceId }),
    [spaces, activeSpaceId],
  )

  return {
    ready,
    spaces,
    activeSpaceId,
    activeSpace,
    setActiveSpaceId,
    createSpace,
    updateSpace,
    deleteSpace,
    addMember,
    updateMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
    addTemplate,
    removeTemplate,
    resetDemo,
    reloadFromStorage,
    replaceAllData,
    getSnapshot,
  }
}
