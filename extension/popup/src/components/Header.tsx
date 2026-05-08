import React from 'react'

interface Props {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: Props) {
  return (
    <header className="header">
      <div className="header-logo">
        {/* Wrench-k SVG inline */}
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="7" fill="#18181b"/>
          <rect x="8" y="6" width="3.5" height="20" rx="1.5" fill="white"/>
          <polygon points="11.5,15 11.5,12.5 21,7 24,7 24,9.5 13,15.5" fill="white"/>
          <polygon points="11.5,17 11.5,19.5 21,25 24,25 24,22.5 13,16.5" fill="white"/>
          <rect x="21.5" y="9" width="2" height="14" rx="0.8" fill="#18181b"/>
        </svg>
        kit
      </div>
      <div className="header-actions">
        <button
          className="icon-btn"
          onClick={onSettingsClick}
          title="Settings"
          aria-label="Settings"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <a
          href="https://kit.shreyannarula.com"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="Open kit in new tab"
          aria-label="Open kit website"
          onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: 'https://kit.shreyannarula.com' }) }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </header>
  )
}
