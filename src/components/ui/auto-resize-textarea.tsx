import * as React from "react";
import { cn } from "@/lib/utils";

export type AutoResizeTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, onChange, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    },
    [ref],
  );

  const resize = React.useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useLayoutEffect(() => {
    if (innerRef.current) resize(innerRef.current);
  });

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      resize(e.target);
      onChange?.(e);
    },
    [onChange, resize],
  );

  return (
    <textarea
      ref={setRefs}
      rows={1}
      onChange={handleChange}
      className={cn("resize-none overflow-hidden", className)}
      {...props}
    />
  );
});
AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };
