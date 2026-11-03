import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <Link href="/">Rekenpagina</Link>
      <Link href="/modellen">Modellen</Link>
      <Link href="/kenteken">Kentekencheck</Link>
    </nav>
  );
}
