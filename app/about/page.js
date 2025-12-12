 export const metadata = {
  title: 'About — Recon Bro',
  description: 'About Recon Bro - AI automation chatbot local demo',
};

export default function AboutPage() {
  return (
    <div className="page-content">
      <h1>About</h1>
      <p className="muted">Recon Bro is a local chatbot UI demo built with Next.js.</p>

      <p>
        This project is meant for local development and testing. Use it to prototype chat UIs,
        integrate a backend, or connect to OpenAI via a secure server route.
      </p>
    </div>
  );
}
