import { describe, expect, it } from "vitest";
import { WRITE_ROLES, ADMIN_ROLES } from "./constants";

describe("tenant authorization helpers", () => {
  it("viewers cannot write", () => {
    expect(WRITE_ROLES.includes("VIEWER")).toBe(false);
    expect(WRITE_ROLES.includes("MEMBER")).toBe(true);
  });

  it("only admins invite", () => {
    expect(ADMIN_ROLES.includes("MEMBER")).toBe(false);
    expect(ADMIN_ROLES.includes("OWNER")).toBe(true);
  });
});
