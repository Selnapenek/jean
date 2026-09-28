import { useEffect, useState } from 'react'

type ModifierState = Pick<
  KeyboardEvent,
  'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
>

/**
 * True while the modifier combination matched by `isHeld` is pressed.
 * Use it to show keyboard shortcut hints only on demand. Pass a stable
 * (module-level) `isHeld` function.
 */
export function useModifierHintsVisible(
  isHeld: (event: ModifierState) => boolean,
  enabled = true
): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      return
    }
    const update = (event: KeyboardEvent) => setVisible(isHeld(event))
    const hide = () => setVisible(false)
    window.addEventListener('keydown', update, { capture: true })
    window.addEventListener('keyup', update, { capture: true })
    window.addEventListener('blur', hide)
    return () => {
      window.removeEventListener('keydown', update, { capture: true })
      window.removeEventListener('keyup', update, { capture: true })
      window.removeEventListener('blur', hide)
    }
  }, [enabled, isHeld])

  return visible
}
