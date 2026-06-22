import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { checkAdminAuth } from "../api"

describe("basic authentication", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset env variables before each test
    process.env.ADMIN_USERNAME = "admin"
    process.env.ADMIN_PASSWORD = "adminpassword"
  })

  afterEach(() => {
    // Restore original env variables
    process.env = { ...originalEnv }
  })

  it("should throw 401 Response when Authorization header is missing", () => {
    const headers = new Headers()

    expect(() => checkAdminAuth(headers)).toThrow(Response)

    try {
      checkAdminAuth(headers)
    } catch (error: any) {
      expect(error.status).toBe(401)
      expect(error.headers.get("WWW-Authenticate")).toBe(
        'Basic realm="Admin Portal"'
      )
    }
  })

  it("should throw 401 Response when Authorization header is incorrect", () => {
    const headers = new Headers()
    headers.set(
      "Authorization",
      "Basic " + Buffer.from("wronguser:wrongpass").toString("base64")
    )

    expect(() => checkAdminAuth(headers)).toThrow(Response)

    try {
      checkAdminAuth(headers)
    } catch (error: any) {
      expect(error.status).toBe(401)
      expect(error.headers.get("WWW-Authenticate")).toBe(
        'Basic realm="Admin Portal"'
      )
    }
  })

  it("should succeed and return success:true when Authorization header is correct", () => {
    const headers = new Headers()
    headers.set(
      "Authorization",
      "Basic " + Buffer.from("admin:adminpassword").toString("base64")
    )

    const result = checkAdminAuth(headers)
    expect(result).toEqual({ success: true })
  })

  it("should respect custom ADMIN_USERNAME and ADMIN_PASSWORD env variables", () => {
    process.env.ADMIN_USERNAME = "super_admin"
    process.env.ADMIN_PASSWORD = "secure_password_99"

    const headers = new Headers()
    headers.set(
      "Authorization",
      "Basic " +
        Buffer.from("super_admin:secure_password_99").toString("base64")
    )

    const result = checkAdminAuth(headers)
    expect(result).toEqual({ success: true })
  })
})
