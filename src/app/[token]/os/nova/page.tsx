import { FormularioNovaOs } from "@/components/os/formulario-nova-os";

export default function NovaOsPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Nova OS</h1>
      <FormularioNovaOs />
    </section>
  );
}
