export default function Footer() {
    return(
        <footer className="w-full border-t bg-white/50 dark:bg-slate-900/80 py-4 mt-6">
<div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-200 font-sembold">
<div className="mb-2 sm:mb-0">© {new Date().getFullYear()} Chatbot UI — Built with Next.js + Tailwind</div>
<div className="flex gap-4">
<a className="hover:underline" href="#">Privacy</a>
<a className="hover:underline" href="#">Terms</a>
<a className="hover:underline" href="#">Contact</a>
</div>
</div>
</footer>
    );
}