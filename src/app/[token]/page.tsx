export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;
  return (
    <main>
      <h1>Assistência Técnica — fundação OK</h1>
    </main>
  );
}
