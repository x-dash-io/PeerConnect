import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { useMessages, useSendMessage, useEditMessage, useDeleteMessage } from "@/hooks/useMessages"
import { Message } from "@/types"

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
  Wrapper.displayName = "QueryClientWrapper"
  return Wrapper
}

const mockMessage: Message = {
  id: "msg-1",
  conversationId: "conv-1",
  senderId: "user-1",
  content: "hello",
  type: "TEXT",
  status: "SENT",
  createdAt: new Date().toISOString(),
}

describe("useMessages", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches messages for a conversation", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ messages: [mockMessage], nextCursor: null }), {
        headers: { "Content-Type": "application/json" },
      }),
    )

    const { result } = renderHook(() => useMessages("conv-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.pages[0].messages).toHaveLength(1)
    expect(result.current.data?.pages[0].messages[0].content).toBe("hello")
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/conversations/conv-1/messages"),
    )
  })

  it("handles fetch error", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useMessages("conv-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useSendMessage", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends a message and updates cache optimistically", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockMessage), {
        headers: { "Content-Type": "application/json" },
      }),
    )

    const { result } = renderHook(() => useSendMessage("conv-1"), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: "hello" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/conversations/conv-1/messages"),
      expect.objectContaining({ method: "POST" }),
    )
  })
})

describe("useEditMessage", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("edits a message", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ...mockMessage, content: "updated", editedAt: new Date().toISOString() }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const { result } = renderHook(() => useEditMessage("conv-1"), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ messageId: "msg-1", content: "updated" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/conversations/conv-1/messages/msg-1"),
      expect.objectContaining({ method: "PATCH" }),
    )
  })
})

describe("useDeleteMessage", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deletes a message", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const { result } = renderHook(() => useDeleteMessage("conv-1"), {
      wrapper: createWrapper(),
    })

    result.current.mutate("msg-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/conversations/conv-1/messages/msg-1"),
      expect.objectContaining({ method: "DELETE" }),
    )
  })
})
