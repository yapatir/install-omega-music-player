import React from "react";
import { useApp } from "../../context/AppContext";
import "./Navigation.css";
import { usePlugins } from "../../context/PluginContext";

const OmegaIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="14"
      cy="13"
      r="9"
      stroke="currentColor"
      strokeWidth="2.2"
      fill="none"
    />
    <path
      d="M10 22 L7 26 M18 22 L21 26"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M10 26 L18 26"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="14" cy="13" r="4" fill="currentColor" opacity="0.25" />
  </svg>
);

const baseNavItems = [
  {
    id: "main",
    labelKey: "main",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "management",
    labelKey: "musicManagement",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },

  {
    id: "customize",
    labelKey: "customize",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20 12H22M2 12H4M19.07 19.07l-1.41-1.41M5.34 5.34 3.93 3.93M12 20v2M12 2v2" />
      </svg>
    ),
  },
  {
    id: "plugins",
    labelKey: "plugins",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
        <line x1="16" y1="8" x2="2" y2="22" />
        <line x1="17.5" y1="15" x2="9" y2="15" />
      </svg>
    ),
  },
  {
    id: "settings",
    labelKey: "settings",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Navigation() {
  const {
    t,
    currentPage,
    setCurrentPage,
    navOpen,
    setNavOpen,
    setExitModalOpen,
  } = useApp();
  const { getPluginPages } = usePlugins();
  const pluginPages = getPluginPages();
  const navItems = [
    ...baseNavItems,
    ...pluginPages.map((p) => ({
      id: p.id,
      label: p.label, // ⚠️ bukan labelKey
      icon: <span>{p.icon || "🧩"}</span>,
    })),
  ];
  return (
    <nav className={`nav ${navOpen ? "nav--open" : "nav--closed"}`}>
      <div className="nav__header">
        <div className="nav__logo">
          <OmegaIcon size={navOpen ? 32 : 26} />
          {navOpen && <span className="nav__title">Omega</span>}
        </div>
        <button
          className="nav__toggle"
          onClick={() => setNavOpen(!navOpen)}
          title="Toggle navigation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            {navOpen ? (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className="nav__items">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav__item ${currentPage === item.id ? "nav__item--active" : ""}`}
            onClick={() => setCurrentPage(item.id)}
            title={
              !navOpen
                ? item.labelKey
                  ? t(item.labelKey)
                  : item.label
                : undefined
            }
          >
            <span className="nav__item-icon">{item.icon}</span>
            {navOpen && (
              <span className="nav__item-label">
                {item.labelKey ? t(item.labelKey) : item.label}
              </span>
            )}
            {currentPage === item.id && (
              <span className="nav__item-indicator" />
            )}
          </button>
        ))}
      </div>

      <div className="nav__footer">
        <button
          className="nav__item nav__item--exit"
          onClick={() => setExitModalOpen(true)}
          title={!navOpen ? t("exit") : undefined}
        >
          <span className="nav__item-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          {navOpen && <span className="nav__item-label">{t("exit")}</span>}
        </button>
      </div>
    </nav>
  );
}
