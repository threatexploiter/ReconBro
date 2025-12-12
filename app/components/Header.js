export default function Header({ theme, toggleTheme }) {
  return (
    <header className="cb-header">
      <div className="cb-container cb-header-inner">
        <div className="cb-brand">
          <div className="cb-avatar">RB</div>
          <div>
            <div className="cb-title">Recon Bro</div>
            <div className="cb-sub">AI Automation Chatbot</div>
          </div>
        </div>

        <nav className="cb-nav">
          <a>Home</a>
          <a>Docs</a>
          <a>Integrations</a>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "🌞" : "🌙"}
          </button>
        </nav>
      </div>
    </header>
  );
}
