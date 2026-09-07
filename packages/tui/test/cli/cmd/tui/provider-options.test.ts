import { describe, expect, test } from "bun:test"
import { providerOptions } from "../../../../src/component/dialog-provider"

describe("providerOptions", () => {
  test("does not include a synthetic Other option", () => {
    expect(providerOptions([{ id: "openai", name: "OpenAI" }]).map((option) => option.value)).toEqual(["openai"])
  })

  test("does not use Other as the generic provider category", () => {
    expect(providerOptions([{ id: "mistral", name: "Mistral" }])[0]?.category).toBe("Providers")
  })

  test("keeps popular providers first and sorts the rest alphabetically", () => {
    expect(
      providerOptions([
        { id: "openai", name: "OpenAI" },
        { id: "custom-z", name: "Zebra Provider" },
        { id: "anthropic", name: "Anthropic" },
        { id: "mistral", name: "Mistral" },
        { id: "aws", name: "AWS Bedrock" },
      ]).map((option) => option.value),
    ).toEqual(["openai", "anthropic", "aws", "mistral", "custom-z"])
  })

  test("does not collide with a configured provider named other", () => {
    const values = providerOptions([{ id: "other", name: "Other Provider" }]).map((option) => option.value)
    expect(values).toEqual(["other"])
    expect(new Set(values).size).toBe(values.length)
  })
})
