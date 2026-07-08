type UnsubscribePageProps = {
  searchParams: Promise<{ status?: string }>;
};

const MESSAGES: Record<string, string> = {
  ok: "Votre désinscription a bien été prise en compte.",
  already: "Vous étiez déjà désinscrit.",
  invalid: "Lien de désinscription invalide ou expiré.",
};

export default async function DesinscriptionPage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;
  const status = params.status ?? "invalid";
  const message = MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center p-6">
      <section className="w-full rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Désinscription</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
