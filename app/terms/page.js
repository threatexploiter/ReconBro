export const metadata = {
  title: 'Terms — Recon Bro',
  description: 'Terms of use for Recon Bro local chatbot demo',
};

export default function TermsPage() {
  return (
    <div className="page-content">
      <h1>Terms of Use</h1>
      <p className="muted">
        This demo is provided as-is for development and testing purposes. Use responsibly.
      </p>

      <p>
        You are responsible for securing any API keys and following the terms of any third-party services
        you connect to (for example, OpenAI).
      </p>
    </div>
  );
}
