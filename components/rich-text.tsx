import { Fragment, type ReactNode } from "react";

// fmt() for sentences with links or emphasis inside: "Questions? {contact}"
// with { contact: <a …/> }. Unknown placeholders stay as text.
export function rich(template: string, values: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{key !== undefined && key in values ? values[key] : part}</Fragment>;
  });
}
