import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav" aria-label="Hoofdmenu">
      <Link href="/">Autokeuze</Link>
      <Link href="/kenteken">Kentekencheck</Link>
      <Link href="/modellen">Modellen</Link>
      <Link href="/rekenpagina">Rekenpagina</Link>
      <Link href="/methodiek">Methodiek</Link>
      <Link href="/over">Over</Link>
    </nav>
  );
}
