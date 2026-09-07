# Candado de proveedores: solo JSON

Este fork no usa el catálogo público (OpenAI, Anthropic, etc.) ni el login **Other**. Los modelos existen solo si están declarados en `opencode.json`. La URL (`baseURL`) la pone el JSON, no el binario.

**Estado**

| Parte | Estado |
| --- | --- |
| Sacar **Other** del login TUI y CLI | Hecho (working tree, sin commit) |
| Candado JSON-only (no catálogo, no cloud por env) | Pendiente |
| Doc de uso para la empresa | Después de implementar el candado |

---

## Quick path

1. Operador declara el proveedor interno en `opencode.json` (id, `npm`, `baseURL`, modelos).
2. El binario carga **solo** esas keys.
3. `opencode auth` y el diálogo TUI no listan cloud. Sin JSON de proveedor, la lista está vacía.
4. `OPENAI_API_KEY` (u otra env de cloud) no inventa un proveedor.

---

## Regla

Si el ID no es una key de `provider` en `opencode.json`, **no existe**.

| Caso | Resultado |
| --- | --- |
| Provider definido en JSON (cualquier id, p. ej. `ollama`) | Existe. `baseURL` y modelos salen del JSON. |
| `"openai": {}` vacío | No prende OpenAI de models.dev: el catálogo no se carga. |
| `OPENAI_API_KEY` sin key en JSON | No carga OpenAI. |
| Login cloud / Other | No se lista. Other ya está sacado. |
| Pedir `openai/gpt-4` sin JSON | `ProviderModelNotFoundError` (error existente). |

**No hacemos:** clavar el host en el binario, policy nueva (`experimental.policies`), config de `ProgramData`, ni borrar archivos del catálogo upstream.

---

## 1. Cambios ya hechos (sacar Other)

Objetivo: nadie puede dar de alta un proveedor ad-hoc desde la UI o el CLI. El interno se configura en JSON.

### `packages/tui/src/component/dialog-provider.tsx`

| Qué se sacó | Dónde |
| --- | --- |
| Constante `CUSTOM_PROVIDER_OPTION_VALUE` y regex de id custom | Top del archivo |
| Tipo unión `provider` \| `custom`; ahora un solo `ProviderOption` | Tipos |
| Opción sintética **Other** al final de `providerOptions()` | `providerOptions()` |
| `normalizeCustomProviderID()` | Función exportada, eliminada |
| Prompt `DialogPrompt` “Other” + toast de validación | `createDialogProviderOptions()` |
| Branch `if (provider.type === "custom")` en `onSelect` | Memo de opciones |
| Prop `custom` en `ApiMethod` y toast “Saved credential… configure in opencode.json” | `ApiMethod` |

El diálogo solo muestra providers que ya vienen de `sync.data.provider_next.all`. Ya no hay flujo para tipear un id libre.

### `packages/opencode/src/cli/cmd/providers.ts`

| Qué se sacó | Dónde |
| --- | --- |
| `{ value: "other", label: "Other" }` en el autocomplete de login | `ProvidersLoginCommand`, prompt “Select provider” |
| Bloque `if (provider === "other")` (pedir id, plugin auth, warning de JSON) | Mismo command, después de elegir provider |

`opencode auth` ya no ofrece Other. Sigue listando el catálogo models.dev: **eso lo corta el candado pendiente**.

### `packages/tui/test/cli/cmd/tui/provider-options.test.ts`

| Test | Cambio |
| --- | --- |
| “includes a synthetic Other option…” | Reemplazado por “does not include a synthetic Other option” |
| Orden de valores | Ya no espera `__opencode_custom_provider__` |
| Colisión con un provider id `other` | La lista es solo `["other"]` |
| `normalizeCustomProviderID` | Test eliminado (función ya no existe) |

---

## 2. Cambios pendientes (candado JSON-only)

Hoy el runtime hidrata **todo** models.dev. Si hay `OPENAI_API_KEY`, OpenAI entra aunque no esté en el JSON. El HTTP list y el CLI auth leen models.dev directo, no el set filtrado.

Predicado único, sin capa nueva: `id` está en `cfg.provider`.

### `packages/opencode/src/provider/provider.ts` — runtime

Función/capa: `Layer` de `Provider.Service`, state init (~línea 1396).

| Sitio actual | Qué hace hoy | Qué tiene que hacer |
| --- | --- | --- |
| `modelsDevSvc.get()` → `catalog` / `database` (~1400) | Copia todo models.dev | No hidratar el catálogo. `database` arranca vacío o solo se llena desde JSON. |
| Loop “extend database from config” (~1477) | Fusiona JSON **encima** del catálogo | Sigue siendo la **única** fuente: id, npm, `options.baseURL`, models. |
| Loop env (~1578) | Si hay env del catálogo (`OPENAI_API_KEY`), `mergeProvider` | No mergear si el id no está en `cfg.provider`. |
| Loop auth/apikeys (~1591) | Credencial guardada prende provider de catálogo | Igual: solo si está en JSON. |
| Plugin auth / `custom()` (~1604, ~1625) | Pueden autoload providers de catálogo | No inventar ids ausentes del JSON. |
| `isProviderAllowed` (~1444) | Solo `enabled_providers` / `disabled_providers` | Exigir `cfg.provider[id]`. Sigue respetando enabled/disabled. |
| Filtro final (~1667) | Borra los no allowed | Se queda; con el predicado nuevo el catálogo no llega. |

`mergeProvider` hoy, si el id no está en `database`, hace `return` sin crear. Por eso el JSON **tiene** que escribir en `database` antes (el loop ~1477 ya lo hace). No hace falta otra fábrica.

### `packages/opencode/src/cli/cmd/providers.ts` — `opencode auth`

`ProvidersLoginCommand`, ~354–368: hoy `modelsDev.get()` y filtra `enabled_providers` / `disabled_providers`.

Cambio: las opciones del autocomplete son **solo** `Object.keys(config.provider ?? {})`. Sin JSON → lista vacía, no cloud.

### `packages/opencode/src/server/routes/instance/httpapi/handlers/provider.ts` — API que alimenta la TUI

`ProviderHttpApi.list` (~42–61): hoy mezcla models.dev filtrado + `provider.list()`.

Cambio: `all` / `connected` salen del set JSON-only (mismo predicado). Si no, la TUI resucita OpenAI aunque el runtime esté cerrado.

`dialog-provider.tsx` no necesita otro filtro si este handler ya no manda cloud. Other ya está fuera.

### Tests — `packages/opencode/test/provider/provider.test.ts`

Reusar fixtures de instancia. Un caso (o dos asserts):

- `OPENAI_API_KEY` set + JSON sin `provider.openai` → OpenAI ausente.
- JSON con un provider custom (npm + baseURL + un modelo) → presente.

No hay suite nueva.

---

## Flujo

```text
opencode.json  →  Provider.Service (sin models.dev)
               →  HTTP list  →  TUI diálogo
               →  CLI auth
               →  resolución de modelo
```

Modelo desconocido → `ProviderModelNotFoundError` (mensaje actual: JSON / `opencode models`). Auth vacío = no hay keys en JSON, no un picker cloud.

---

## Ejemplo de JSON interno

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

Cualquier id vale. Cambiar la URL es editar `options.baseURL`. No hay login cloud.

---

## Doc de uso (después de implementar el candado)

Markdown corto: cómo declarar el proveedor interno (id, npm, baseURL, models). Aclarar que no hay catálogo ni `opencode auth` de cloud.

---

## Checklist de revisión

- [ ] Other no aparece en TUI ni en `opencode auth` (ya hecho).
- [ ] Sin key en JSON, models.dev no aparece en runtime, auth ni HTTP list.
- [ ] Env de cloud no crea provider.
- [ ] JSON con custom provider funciona y puede cambiar `baseURL`.
- [ ] No hay tipo de error nuevo ni policy nueva.

## Siguiente paso

Aprobar este spec → plan de implementación → código + test + doc de uso.
