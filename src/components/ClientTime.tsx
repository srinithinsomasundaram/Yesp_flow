"use client";

export function ClientTime({ ts }: { ts: string }) {
  return (
    <>
      {new Date(ts).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </>
  );
}
