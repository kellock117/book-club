export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="py-16 text-center">
      <h1 className="mb-2 font-serif text-2xl font-bold">{title}</h1>
      <p className="text-muted">아직 준비 중이에요.</p>
    </section>
  );
}
