// Read-only demo mode. When the demo account is logged in, the app serves
// fake data and blocks all writes. The flag is set by AuthContext on login.

export const DEMO_EMAIL = 'demo@nomail.com'

let _demo = false

export function setDemoMode(on) {
  _demo = !!on
}

export function isDemo() {
  return _demo
}

export class DemoReadOnlyError extends Error {
  constructor() {
    super('This is a read-only demo account — creating, editing, and deleting are disabled.')
    this.name = 'DemoReadOnlyError'
  }
}

// Helper for mutation functions: throw a friendly error in demo mode.
export function blockIfDemo() {
  if (_demo) throw new DemoReadOnlyError()
}
