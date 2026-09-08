# Proveedores internos (JSON-only)

Este fork no carga el catálogo público (OpenAI, Anthropic, etc.). Un proveedor existe solo si está en `opencode.json`.

No hay login cloud. `opencode auth` y la TUI listan únicamente las keys del JSON. `OPENAI_API_KEY` no inventa un provider.

## Cómo declararlo

En `opencode.json` (proyecto o `~/.config/opencode/`):

```json
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama interno",
      "options": {
        "baseURL": "https://ollama.empresa.local/v1"
      },
      "models": {
        "llama": {
          "name": "Llama"
        }
      }
    }
  }
}
```

Cualquier id vale. Cambiar el host es editar `options.baseURL`.

No declares `openai` / `anthropic` en el JSON si no querés esos modelos: una key vacía habilita el catálogo de ese id.

## Correr este fork

Desde la raíz del repo, no el `opencode` global. Para no mezclar con el OpenCode instalado:

```bat
set OPENCODE_CONFIG_DIR=%USERPROFILE%\.local\share\opencode-enterprise\config
set XDG_DATA_HOME=%USERPROFILE%\.local\share\opencode-enterprise\xdg-data
bun dev .
```

## Qué no aparece

- Other / proveedor custom desde la UI
- Catálogo models.dev
- Modelos cloud por variable de entorno
