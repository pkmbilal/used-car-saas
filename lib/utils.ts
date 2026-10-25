import { createCn } from "cn/config"

// Custom font sizes from globals.css; without this, cn treats `text-label`
// etc. as text colors and drops the component's own color.
export const cn = createCn({
  extend: { classGroups: { "font-size": [{ text: ["eyebrow", "caption", "label"] }] } },
})
