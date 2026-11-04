import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/">Autokeuze</Link>
      <Link href="/kenteken">Kentekencheck</Link>
      <Link href="/modellen">Modellen</Link>
      <Link href="/rekenpagina">Rekenpagina</Link>
    </nav>
  );
}
