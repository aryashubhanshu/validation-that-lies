import { RegistrationForm } from "@/components/registration-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono mb-2">
            Validation That Lies
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/10 bg-[#161618] overflow-hidden">
          <div className="p-6">
            <RegistrationForm />
          </div>
        </div>
      </div>
    </main>
  );
}