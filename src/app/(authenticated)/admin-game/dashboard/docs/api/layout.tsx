/** Feuille de styles Swagger UI (CDN pin) — sous-chemins docs API du dashboard. */
export default function DashboardApiDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
        crossOrigin="anonymous"
      />
      {children}
    </>
  );
}
