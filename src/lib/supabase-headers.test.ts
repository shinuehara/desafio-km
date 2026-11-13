import { describe, expect, it } from "vitest";
import { supabaseAuthHeaders } from "./supabase-headers";

describe("chaves do Supabase", () => {
  it("chave antiga (JWT) vai também no Authorization", () => {
    expect(supabaseAuthHeaders("eyJabc")).toEqual({ apikey: "eyJabc", Authorization: "Bearer eyJabc" });
  });
  it("chave nova sb_secret_ vai só no apikey", () => {
    expect(supabaseAuthHeaders("sb_secret_xyz")).toEqual({ apikey: "sb_secret_xyz" });
  });
});
