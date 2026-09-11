import { describe, expect, test } from "bun:test"
import { fitArt } from "../../src/logo"

describe("fitArt", () => {
  test("returns lines unchanged when they already fit", () => {
    expect(fitArt(["@@", "@@"], 10, 10)).toEqual(["@@", "@@"])
  })

  test("samples every Nth column when wider than maxWidth", () => {
    expect(fitArt(["abcdefgh"], 4, 10)).toEqual(["aceg"])
  })

  test("samples rows to preserve aspect when downscaling", () => {
    const lines = ["abcd", "efgh", "ijkl", "mnop"]
    expect(fitArt(lines, 2, 2)).toEqual(["ac", "ik"])
  })

  test("never upscales small art", () => {
    expect(fitArt(["@@"], 100, 100)).toEqual(["@@"])
  })
})
