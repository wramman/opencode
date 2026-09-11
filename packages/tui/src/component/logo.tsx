import { createMemo, For } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { art, fitArt } from "../logo"

export function Logo() {
  const { theme } = useTheme()
  const dimensions = useTerminalDimensions()
  const lines = createMemo(() =>
    fitArt(art, Math.max(20, dimensions().width - 6), Math.max(6, dimensions().height - 14)),
  )

  return (
    <box flexDirection="column">
      <For each={lines()}>
        {(line) => (
          <text fg={theme.text} selectable={false}>
            {line}
          </text>
        )}
      </For>
    </box>
  )
}
