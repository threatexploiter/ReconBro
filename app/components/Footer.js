export default function Footer() {
  return (
    <footer className="cb-footer">
      <div style={{maxWidth:1200, margin:'0 auto', padding:'0 20px', color:'var(--muted)', fontSize:13}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>© 2025 Chatbot UI — Built with Next.js + Tailwind</div>
          <div style={{display:'flex', gap:16}}>
            <a href="/privacy" style={{color:'var(--muted)'}}>Privacy</a>
            <a href="/terms" style={{color:'var(--muted)'}}>Terms</a>
            <a href="/contact" style={{color:'var(--muted)'}}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
