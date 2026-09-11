# Proveedores internos (JSON-only)

Este binario **no lee** `~\.config\opencode` (esa es tu sesión instalada). Config del fork: `.opencode/opencode.json` y `%USERPROFILE%\.local\share\opencode-enterprise\config`.

Este fork no usa APIs públicas. Un proveedor entra solo si:

1. Está declarado en `opencode.json`, **y**
2. Su id **no** es de una compañía del catálogo (openai, anthropic, google, openrouter, nvidia, …).

`opencode.json` con `"openai": { ... }` **no** conecta a OpenAI. `OPENAI_API_KEY` tampoco. Usá un id propio (`ollama`, `empresa-llm`, …) y un `baseURL` interno.

## Cómo declararlo

En `.opencode/opencode.json` de este fork.

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

Cambiar el host es editar `options.baseURL`. El id tiene que ser propio: `ollama` sí, `openai` no.

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
- IDs públicos aunque estén en el JSON (`openai`, `anthropic`, `google`, …)
