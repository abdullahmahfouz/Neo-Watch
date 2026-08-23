import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react'

const LINKS = [
  {
    href: 'mailto:aboudmahfouz@gmail.com',
    label: 'aboudmahfouz@gmail.com',
    icon: EnvelopeSimple,
  },
  {
    href: 'https://github.com/abdullahmahfouz',
    label: 'github.com/abdullahmahfouz',
    icon: GithubLogo,
  },
  {
    href: 'https://www.linkedin.com/in/abdullah-mahfouz-5188b1306/',
    label: 'LinkedIn',
    icon: LinkedinLogo,
  },
]

export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 border-t border-[var(--color-line)] px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
        Built by Abdullah Mahfouz
      </span>
      <div className="flex items-center gap-5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer' : undefined}
            className="flex items-center gap-1.5 text-xs text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
          >
            <Icon size={14} />
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
