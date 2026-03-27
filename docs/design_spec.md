# Design Specification (Updated): PeerConnect
> **Version:** 2.0 — Research-Validated  
> **Date:** March 2026

---

## 1. Vision: "Professional Premium"

PeerConnect's visual identity is **high-contrast minimalism with a "Dark First" priority**. The interface feels alive through micro-animations but remains professional and uncluttered. Every pixel serves a purpose. No decorative gradients for the sake of it — only purposeful depth.

### Design Philosophy
- **Restraint over decoration.** Negative space is a design element, not empty space.
- **Depth through shadows**, not color bloat.
- **Motion with purpose** — every animation communicates state, not just aesthetics.
- **Typography as identity** — Manrope for authority, Lato for comfort.

---

## 2. Color Tokens (CSS Variables)

### A. Backgrounds & Surfaces

| Token | Dark Mode (Default) | Light Mode | Application |
|:---|:---|:---|:---|
| `--bg-deep` | `#09090B` | `#FFFFFF` | Root container background |
| `--bg-surface` | `#161618` | `#F9F9FB` | Chat bubbles, sidebars, cards |
| `--bg-muted` | `#232326` | `#F4F4F5` | Secondary surfaces, hover states |
| `--bg-elevated` | `#2A2A2E` | `#ECECF0` | Modals, dropdowns, tooltips |

### B. Foregrounds (Text)

| Token | Dark Mode | Light Mode | Application |
|:---|:---|:---|:---|
| `--text-high` | `#EDEDED` | `#09090B` | Primary body text, titles |
| `--text-medium` | `#A1A1AA` | `#71717A` | Captions, timestamps, metadata |
| `--text-low` | `#52525B` | `#A1A1AA` | Disabled states, placeholder text |

### C. Brand & Semantic

| Token | Hex Value | Application |
|:---|:---|:---|
| `--primary` | `#6366F1` (Indigo 500) | CTAs, active states, brand identity |
| `--primary-hover` | `#4F46E5` (Indigo 600) | Hover/pressed primary |
| `--primary-subtle` | `rgba(99,102,241,0.12)` | Highlight backgrounds |
| `--accent` | `#10B981` (Emerald 500) | Online presence, success states |
| `--accent-warning` | `#F59E0B` (Amber 500) | Away status, warnings |
| `--accent-danger` | `#EF4444` (Red 500) | Errors, destructive actions |
| `--border` | `#27272A` | Crisp 1px separators |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Glassmorphism borders |

### Tailwind Config Integration
```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'bg-deep': 'var(--bg-deep)',
      'bg-surface': 'var(--bg-surface)',
      'bg-muted': 'var(--bg-muted)',
      'primary': 'var(--primary)',
      'accent': 'var(--accent)',
      'text-high': 'var(--text-high)',
      'text-medium': 'var(--text-medium)',
      'text-low': 'var(--text-low)',
    }
  }
}
```

---

## 3. Typography

| Role | Font | Weight | Size | Application |
|:---|:---|:---|:---|:---|
| **Display/Logo** | `Manrope` | 700–800 | 24–48px | Headings, brand mark, onboarding |
| **Body/UI** | `Lato` | 400–700 | 14–16px | Messages, labels, navigation |
| **Mono** | `JetBrains Mono` | 400 | 13px | Code blocks in messages |

### Loading Strategy
```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Lato:wght@400;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

---

## 4. Component Specifications

### Chat Bubble (Sent)
```
Background: --primary (Indigo 500)
Border Radius: 18px 18px 4px 18px
Padding: 10px 14px
Text Color: #FFFFFF
Max Width: 72% of chat window
```

### Chat Bubble (Received)
```
Background: --bg-surface (#161618)
Border: 1px solid --border (#27272A)
Border Radius: 18px 18px 18px 4px
Padding: 10px 14px
Text Color: --text-high (#EDEDED)
```

### Sidebar / Chat List Item
```
Height: 72px
Padding: 12px 16px
Hover Background: --bg-muted (#232326)
Active Background: rgba(99,102,241,0.10) with --primary left border (3px)
Avatar Size: 44px, circular, ring on active (--primary, 2px)
```

### Input Bar
```
Background: --bg-surface
Border: 1px solid --border
Border Radius: 12px
Padding: 12px 16px
Focus Border: --primary
Height: Auto-growing (min 44px, max 120px)
```

### Presence Dot
```
Online: --accent (#10B981), 10px circle
Away: --accent-warning (#F59E0B), 10px circle
Offline: --text-low (#52525B), 10px circle
Position: Bottom-right of avatar, with 2px --bg-deep ring
```

---

## 5. Visual Treatments

### Glassmorphism (Navigation & Sidebars)
```css
.glass {
  background: rgba(22, 22, 24, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```
Apply to: Fixed top nav, floating action menus, command palette overlay.

### Inner Shadows (Cards & Inputs)
```css
/* Instead of outer box-shadow, use inset for dark UI depth */
.card-elevated {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06),
              0 4px 24px rgba(0,0,0,0.4);
}
```

### Skeleton Loading
```css
/* Animated skeleton for chat list and message history */
.skeleton {
  background: linear-gradient(90deg, 
    var(--bg-surface) 25%, 
    var(--bg-muted) 50%, 
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}
```

---

## 6. Micro-Animations (Framer Motion)

### Message Pop-In
```tsx
// New message arriving
const messageVariants = {
  initial: { opacity: 0, scale: 0.85, y: 8 },
  animate: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 20, duration: 0.15 }
  }
}
```

### Onboarding Step Transitions
```tsx
// Lateral slide between onboarding steps
const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
}
```

### Typing Indicator (3 Dots)
```tsx
// Animated typing dots
const dotVariants = {
  animate: { y: [0, -4, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.1 } }
}
// Stagger delay: dot1 = 0s, dot2 = 0.1s, dot3 = 0.2s
```

### Sidebar Chat Item Hover
```tsx
{ whileHover: { x: 2 }, transition: { duration: 0.12 } }
```

### Message Status Tick Transition
```tsx
// SENT (single) → DELIVERED (double) → READ (double blue)
// Animate opacity of second tick and color transition
```

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|:---|:---|:---|
| Mobile | < 768px | Full-screen chat only, hamburger sidebar |
| Tablet | 768–1024px | Split: 320px sidebar + chat |
| Desktop | > 1024px | 320px sidebar + chat + optional detail panel |

---

## 8. File & Asset Guidelines

- **Icons:** `lucide-react` — 20px default stroke width 1.5
- **Images:** `.webp` preferred, `.png` fallback — transparent backgrounds
- **Avatars:** Circular crop, 44px (sidebar), 40px (chat header), 32px (message bubble)
- **Fallback Avatar:** CSS-generated initials with `--primary-subtle` background
- **Audio Waveform:** Custom SVG bar visualization for audio messages
- **File Preview Cards:** Rounded 8px, file icon (Lucide) + filename + size + download action

---

## 9. Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text
- All interactive elements: `focus-visible` ring using `--primary`
- Screen reader: `aria-label` on icon buttons, `role="status"` on typing indicators
- Reduced motion: Wrap all Framer Motion with `useReducedMotion()` check
- Keyboard navigation: Tab through conversations, Enter to open, Escape to close modals