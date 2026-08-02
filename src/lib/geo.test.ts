import { describe, expect, it } from "vitest";
import {
  countryFromLocale,
  resolveSupportedCountry,
} from "./geo";

describe("geo country resolve", () => {
  it("accepts supported ISO codes", () => {
    expect(resolveSupportedCountry("gr")).toBe("GR");
    expect(resolveSupportedCountry("FR")).toBe("FR");
    expect(resolveSupportedCountry("UK")).toBe("GB");
  });

  it("rejects unsupported codes", () => {
    expect(resolveSupportedCountry("DE")).toBeNull();
    expect(resolveSupportedCountry("")).toBeNull();
  });

  it("reads region from locale", () => {
    expect(countryFromLocale("el-GR")).toBe("GR");
    expect(countryFromLocale("fr-FR")).toBe("FR");
    expect(countryFromLocale("en-US")).toBe("US");
  });
});
