'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function Logo ({ footer = false }: { footer?: boolean }) {
  if (footer) {
    return (
      <div className="logo">
        <span className="footer-logo-aws">aws</span>
        <div className="footer-logo-sep logo-sep" />
        <div className="logo-meta">
          <span className="footer-logo-club logo-club">Cloud Clubs</span>
          <span className="footer-logo-inst logo-inst">ADYPSOE</span>
          <div className="logo-bar">
            <div className="logo-bar-main" />
            <div className="logo-bar-dot" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <Link href="#hero" className="logo">
      <span className="logo-aws">aws</span>
      <div className="logo-sep" />
      <div className="logo-meta">
        <span className="logo-club">Cloud Clubs</span>
        <span className="logo-inst">ADYPSOE</span>
        <div className="logo-bar">
          <div className="logo-bar-main" />
          <div className="logo-bar-dot" />
        </div>
      </div>
    </Link>
  )
}

export { Logo }

export default function Nav () {
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) applyTheme(saved)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function applyTheme (t: 'dark' | 'light') {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme', t)
  }

  function toggleTheme () {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <Logo />
      <ul className="nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#events">Events</a></li>
        <li><a href="#gallery">Gallery</a></li>
        <li><a href="#partners">Partners</a></li>
        <li>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </li>
        <li><a href="#join" className="nav-cta">Join Us</a></li>
      </ul>
    </nav>
  )
}
