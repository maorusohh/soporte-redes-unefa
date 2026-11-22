import { useEffect, useRef } from "react";

export default function FocusHeading({
  as: Tag = "h1",
  children,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Tag ref={ref} tabIndex={-1} {...props}>
      {children}
    </Tag>
  );
}
