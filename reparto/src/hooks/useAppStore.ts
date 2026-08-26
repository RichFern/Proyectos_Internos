import { useCallback, useEffect, useState } from 'react'
import type {
  AppData,
  Expense,
  ExpenseCategory,
  ExpenseTemplate,
  InstallmentPlan,
  Member,
  SettlementRecord,
  Space,
} from '../types'
import { MEMBER_COLORS } from '../types'
import { createId } from '../lib/id'
import { loadData, saveData, resetDemoData } from '../lib/storage'
import { buildInstallmentPlan } from '../lib/installments'
import { clearIncomeForMonth, setIncomeForMonth } from '../lib/members'
import { setBudgetForMonth } from '../lib/budgets'
import {
  loadLocalIdentity,
  saveLocalIdentity,
  type LocalIdentity,
} from '../lib/identity'

export function useAppStore() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [localIdentity, setLocalIdentityState] = useState<LocalIdentity | null>(
    null,
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const data = loadData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    const identity = data.localIdentity ?? loadLocalIdentity()
    if (identity) {
      setLocalIdentityState(identity)
      saveLocalIdentity(identity)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveData({ spaces, activeSpaceId, localIdentity })
  }, [spaces, activeSpaceId, localIdentity, ready])

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? null

  const setLocalIdentity = useCallback((identity: LocalIdentity) => {
    setLocalIdentityState(identity)
    saveLocalIdentity(identity)
  }, [])

  const createSpace = useCallback(
    (
      input: Pick<Space, 'name' | 'description' | 'kind'> & { personal?: boolean },
      ownerKey: string | null,
      ownerUid: string | null = null,
    ) => {
      const now = new Date().toISOString()
      const personal = Boolean(input.personal && ownerKey)
      const space: Space = {
        id: createId(),
        name: input.name,
        description: input.description,
        kind: input.kind,
        visibility: personal ? 'personal' : 'shared',
        ownerKey: personal ? ownerKey : null,
        ownerUid: personal ? ownerUid : null,
        members: [],
        expenses: [],
        templates: [],
        installmentPlans: [],
        settlementRecords: [],
        budgetsByMonth: {},
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
    (
      spaceId: string,
      input: Pick<Member, 'name' | 'income' | 'contributionPercent'>,
    ) => {
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
    (
      spaceId: string,
      memberId: string,
      patch: Partial<Member> & {
        monthIncome?: { month: string; amount: number } | null
      },
    ) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          return {
            ...s,
            members: s.members.map((m) => {
              if (m.id !== memberId) return m
              const { monthIncome, ...rest } = patch
              let next: Member = { ...m, ...rest }
              if (monthIncome) {
                next =
                  monthIncome.amount < 0
                    ? clearIncomeForMonth(next, monthIncome.month)
                    : setIncomeForMonth(next, monthIncome.month, monthIncome.amount)
              }
              return next
            }),
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

  const addInstallmentPlan = useCallback(
    (
      spaceId: string,
      input: {
        description: string
        category: InstallmentPlan['category']
        totalAmount: number
        installmentCount: number
        paidById: string
        splitMode: InstallmentPlan['splitMode']
        participantIds: string[]
        customShares?: Record<string, number>
        visibility?: InstallmentPlan['visibility']
        ownerUid?: string | null
        startDate: string
        notes?: string
      },
    ) => {
      const { plan, expenses } = buildInstallmentPlan(input)
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          const stamped = expenses.map((e) => ({
            ...e,
            id: createId(),
            createdAt: new Date().toISOString(),
          }))
          return {
            ...s,
            installmentPlans: [plan, ...(s.installmentPlans ?? [])],
            expenses: [...stamped, ...s.expenses],
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      return plan.id
    },
    [],
  )

  const recordSettlement = useCallback(
    (
      spaceId: string,
      input: Omit<SettlementRecord, 'id' | 'createdAt'>,
    ) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          const record: SettlementRecord = {
            ...input,
            id: createId(),
            createdAt: new Date().toISOString(),
          }
          return {
            ...s,
            settlementRecords: [...(s.settlementRecords ?? []), record],
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const removeSettlementRecord = useCallback(
    (spaceId: string, recordId: string) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          return {
            ...s,
            settlementRecords: (s.settlementRecords ?? []).filter(
              (r) => r.id !== recordId,
            ),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const setCategoryBudget = useCallback(
    (
      spaceId: string,
      month: string,
      category: ExpenseCategory,
      limit: number | null,
    ) => {
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id !== spaceId) return s
          return {
            ...setBudgetForMonth(s, month, category, limit),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
    },
    [],
  )

  const resetDemo = useCallback(() => {
    const data = resetDemoData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    if (data.localIdentity) {
      setLocalIdentityState(data.localIdentity)
      saveLocalIdentity(data.localIdentity)
    }
  }, [])

  const reloadFromStorage = useCallback(() => {
    const data = loadData()
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    if (data.localIdentity) setLocalIdentityState(data.localIdentity)
  }, [])

  const replaceAllData = useCallback((data: AppData) => {
    setSpaces(data.spaces)
    setActiveSpaceId(data.activeSpaceId)
    if (data.localIdentity) {
      setLocalIdentityState(data.localIdentity)
      saveLocalIdentity(data.localIdentity)
    }
    saveData(data)
  }, [])

  const getSnapshot = useCallback(
    (): AppData => ({ spaces, activeSpaceId, localIdentity }),
    [spaces, activeSpaceId, localIdentity],
  )

  return {
    ready,
    spaces,
    activeSpaceId,
    activeSpace,
    localIdentity,
    setActiveSpaceId,
    setLocalIdentity,
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
    addInstallmentPlan,
    recordSettlement,
    removeSettlementRecord,
    setCategoryBudget,
    resetDemo,
    reloadFromStorage,
    replaceAllData,
    getSnapshot,
  }
}
