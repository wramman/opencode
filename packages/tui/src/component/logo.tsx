import { For } from "solid-js"
import { useTheme } from "../context/theme"
import { art } from "../logo"

export function Logo() {
  const { theme } = useTheme()

  return (
    <box flexDirection="column">
      <For each={art}>
        {(line) => (
          <text fg={theme.text} selectable={false}>
            {line}
          </text>
        )}
      </For>
    </box>
  )
}
