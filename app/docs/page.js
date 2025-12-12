export const metadata = {
  title: 'Docs — Recon Bro',
  description: 'Documentation for Recon Bro local chatbot UI',
};

export default function DocsPage() {
  return (
    <div className="page-content">
      <h1>Docs</h1>
      <p className="muted">Quick start, usage and examples for the Recon Bro chat UI.</p>
      <p className="text-xl">Do not forget to do this: <code className="text-2xl">chmod +x hackerone-results/Recon.sh</code></p>
      <section>
        <h2>Quick start</h2>
        <ol>
          <li>Run <code>npm install</code> and <code>npm run dev</code>.</li>
          <li>Open <code>http://localhost:3000</code>.</li>
          <li>To use a real model, create a server route <code>/api/chat</code> and call OpenAI from there.</li>
        </ol>
      </section>

      <section>
        <h2>Available Endpoints</h2>
        <p className="muted">If you created API routes, they live under <code>app/api/*</code>. Example:</p>
        <pre>/api/ping  — GET</pre>
        <pre>/api/chat  — POST</pre>
      </section>
    </div>
  );
}
