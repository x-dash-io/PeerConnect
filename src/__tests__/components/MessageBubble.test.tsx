import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { Message } from "@/types"

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img data-testid="mock-image" {...props} />
  ),
}))

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-1",
    content: "Hello world",
    type: "TEXT",
    status: "SENT",
    createdAt: "2025-01-01T12:00:00Z",
    ...overrides,
  }
}

describe("MessageBubble", () => {
  it("renders message content", () => {
    render(<MessageBubble message={createMessage()} isSelf={false} isGrouped={false} />)
    expect(screen.getByText("Hello world")).toBeInTheDocument()
  })

  it("shows deleted placeholder when isDeleted as thin separator", () => {
    render(
      <MessageBubble
        message={createMessage({ isDeleted: "true" })}
        isSelf={false}
        isGrouped={false}
      />,
    )
    expect(screen.getByText("Message deleted")).toBeInTheDocument()
  })

  it("shows edited indicator when editedAt is set", () => {
    render(
      <MessageBubble
        message={createMessage({ editedAt: "2025-01-01T13:00:00Z" })}
        isSelf={false}
        isGrouped={false}
      />,
    )
    expect(screen.getByText("Edited")).toBeInTheDocument()
  })

  it("shows timestamp", () => {
    render(<MessageBubble message={createMessage()} isSelf={false} isGrouped={false} />)
    expect(screen.getByText(/:/)).toBeInTheDocument()
  })

  it("calls onEdit when save button clicked in edit mode", async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <MessageBubble message={createMessage()} isSelf={true} isGrouped={false} onEdit={onEdit} />,
    )

    const editBtn = screen.getByRole("button", { name: "Message actions" })
    await user.click(editBtn)

    const pencilBtn = await screen.findByRole("menuitem", { name: /edit/i })
    await user.click(pencilBtn)

    const textarea = screen.getByRole("textbox")
    await user.clear(textarea)
    await user.type(textarea, "Edited content")

    const saveBtn = screen.getByRole("button", { name: "Save edit" })
    await user.click(saveBtn)

    expect(onEdit).toHaveBeenCalledWith("msg-1", "Edited content")
  })

  it("calls onDelete when delete confirmed", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <MessageBubble
        message={createMessage()}
        isSelf={true}
        isGrouped={false}
        onDelete={onDelete}
      />,
    )

    const actionsBtn = screen.getByRole("button", { name: "Message actions" })
    await user.click(actionsBtn)

    const deleteItem = await screen.findByRole("menuitem", { name: /delete/i })
    await user.click(deleteItem)

    const confirmBtn = screen.getByRole("button", { name: /delete/i })
    await user.click(confirmBtn)

    expect(onDelete).toHaveBeenCalledWith("msg-1")
  })

  it("calls onReply when reply clicked", async () => {
    const user = userEvent.setup()
    const onReply = vi.fn()

    render(
      <MessageBubble
        message={createMessage()}
        isSelf={false}
        isGrouped={false}
        onReply={onReply}
      />,
    )

    const actionsBtn = screen.getByRole("button", { name: "Message actions" })
    await user.click(actionsBtn)

    const replyItem = await screen.findByRole("menuitem", { name: /reply/i })
    await user.click(replyItem)

    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ id: "msg-1" }))
  })

  it("calls onReact when quick reaction clicked", async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()

    render(
      <MessageBubble
        message={createMessage()}
        isSelf={false}
        isGrouped={false}
        onReact={onReact}
      />,
    )

    const addBtn = screen.getByRole("button", { name: "Add reaction" })
    await user.click(addBtn)

    const firstEmoji = QUICK_EMOJIS[0]
    const emojiBtn = screen.getByRole("button", { name: `React with ${firstEmoji}` })
    await user.click(emojiBtn)

    expect(onReact).toHaveBeenCalledWith("msg-1", firstEmoji)
  })

  it("renders reply preview when replyTo is present", () => {
    render(
      <MessageBubble
        message={createMessage({
          replyTo: { id: "orig-1", content: "Original message", senderName: "Alice" },
        })}
        isSelf={false}
        isGrouped={false}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Original message")).toBeInTheDocument()
  })

  it("hides sender name and avatar when grouped", () => {
    render(<MessageBubble message={createMessage()} isSelf={false} isGrouped={true} />)
    expect(screen.queryByText("senderName")).not.toBeInTheDocument()
  })

  it("shows sender name when not grouped", () => {
    render(
      <MessageBubble
        message={createMessage({ senderName: "Alice" })}
        isSelf={false}
        isGrouped={false}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("shows read more for long content", () => {
    const longContent = "A".repeat(500)
    render(
      <MessageBubble
        message={createMessage({ content: longContent })}
        isSelf={false}
        isGrouped={false}
      />,
    )
    expect(screen.getByText(/read more/i)).toBeInTheDocument()
  })
})
