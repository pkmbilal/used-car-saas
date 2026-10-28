// Inside the shell, so the sidebar stays put while a section loads.
export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-5xl animate-pulse gap-4" aria-busy>
      <div className="h-9 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
