export const metadata = {
  title: 'Privacy Policy — Recon Bro',
  description: 'Privacy policy for Recon Bro local chatbot demo',
};

export default function PrivacyPage() {
  return (
    <div className="page-content">
      <h1>Privacy policy</h1>
      <p className="muted">This is a local demo — no data is sent anywhere by default.</p>

      <p>
        If you configure a backend or a third-party API (OpenAI, etc.), that external service may
        receive user messages. Make sure to read and follow the privacy policy of that service.
      </p>

      <h3>Local usage</h3>
      <ul>
        <li>Data stays in your browser and server unless you send it to external APIs.</li>
        <li>Store sensitive keys only in <code>.env.local</code> on the server.</li>
      </ul>
    </div>
  );
}
