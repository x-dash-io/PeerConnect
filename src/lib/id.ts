import { customAlphabet } from "nanoid"
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 21)
export const generateId = () => nanoid()
