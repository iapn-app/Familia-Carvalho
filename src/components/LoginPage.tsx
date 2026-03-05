"use client";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-lux text-white">
      <div className="absolute inset-0 bg-lux-animated" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 vignette" />
        <div className="absolute left-1/2 top-[18%] h-[620px] w-[620px] -translate-x-1/2 rounded-full halo" />
        <div className="absolute -left-52 bottom-[-220px] h-[640px] w-[640px] rounded-full goldGlow" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="mt-1 text-sm text-white/70">
              Acesse com seu nome e PIN de 4 dígitos.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="text-xs text-white/70">Nome</label>
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/15"
                placeholder="Ex: João"
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70">Celular (últimos 4)</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/15"
                  placeholder="9987"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="text-xs text-white/70">PIN (4 dígitos)</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/15"
                  placeholder="••••"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-400/95 via-yellow-300/90 to-amber-400/95 px-4 py-3 font-semibold text-slate-900 shadow-[0_12px_40px_rgba(245,158,11,0.25)] active:scale-[0.99]"
            >
              Entrar
            </button>

            <button
              type="button"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              Esqueci meu PIN
            </button>

            <p className="pt-2 text-center text-[11px] text-white/50">
              Dica: use sempre o mesmo nome para manter seu ranking.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
