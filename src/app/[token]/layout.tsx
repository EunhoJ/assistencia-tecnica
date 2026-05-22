import { NavBar } from "@/components/shared/nav-bar";

export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <>
      <header>
        <NavBar token={token} />
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
