const TOUR_KEY = 'reparto-tour-v1'

export function isTourCompleted(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === 'done'
  } catch {
    return false
  }
}

export function completeTour(): void {
  try {
    localStorage.setItem(TOUR_KEY, 'done')
  } catch {
    /* ignore */
  }
}

export function resetTour(): void {
  try {
    localStorage.removeItem(TOUR_KEY)
  } catch {
    /* ignore */
  }
}
