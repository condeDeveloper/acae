<template>
  <div class="landing">

    <!-- ── Navbar ── -->
    <header class="navbar">
      <div class="navbar-inner">
        <img :src="acaeLogo" alt="ACAE" class="nav-logo" />
        <nav class="nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#preco">Preço</a>
        </nav>
        <div class="nav-actions">
          <a href="/login" class="btn-ghost">Entrar</a>
          <a href="/login?tab=cadastro" class="btn-primary">Criar conta</a>
        </div>
      </div>
    </header>

    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-badge">Para professores da educação especial</span>
        <h1 class="hero-title">Do registro ao<br /><span class="hero-highlight">relatório em minutos</span></h1>
        <p class="hero-sub">
          O ACAE reúne registros de alunos, chamada, avaliações e geração de documentos com IA em um único lugar.
          Menos burocracia, mais tempo para o que importa.
        </p>
        <div class="hero-actions">
          <a href="/login?tab=cadastro" class="btn-primary btn-lg">Criar conta grátis</a>
          <a href="#funcionalidades" class="btn-ghost btn-lg">Ver funcionalidades</a>
        </div>
        <p class="hero-note">Sem cartão de crédito para começar · Cancele quando quiser</p>
      </div>
      <div class="hero-visual">
        <div class="mockup-card">
          <div class="mockup-header">
            <span class="mockup-dot red" /><span class="mockup-dot yellow" /><span class="mockup-dot green" />
          </div>
          <div class="mockup-row"><span class="mockup-label">Aluno</span><span class="mockup-value">Lucas M. — Turma AEE Manhã</span></div>
          <div class="mockup-row"><span class="mockup-label">Período</span><span class="mockup-value">1º bimestre 2026</span></div>
          <div class="mockup-row"><span class="mockup-label">Documento</span><span class="mockup-value">Portfólio Semanal ✓</span></div>
          <div class="mockup-ai">
            <span class="mockup-ai-badge">IA</span>
            <span class="mockup-ai-text">"Lucas demonstrou evolução na comunicação funcional, utilizando pictogramas de forma consistente durante as atividades..."</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Funcionalidades ── -->
    <section class="features" id="funcionalidades">
      <div class="section-inner">
        <h2 class="section-title">Tudo que você precisa, em um só lugar</h2>
        <p class="section-sub">Desenvolvido especificamente para o trabalho com AEE e educação especial.</p>
        <div class="features-grid">
          <div class="feature-card" v-for="f in features" :key="f.title">
            <div class="feature-icon">{{ f.emoji }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Pricing ── -->
    <section class="pricing" id="preco">
      <div class="section-inner">
        <h2 class="section-title">Um preço simples, sem surpresas</h2>
        <p class="section-sub">Tudo incluso, para um professor.</p>
        <div class="pricing-card">
          <div class="pricing-badge">Plano Professor</div>
          <div class="pricing-value">
            <span class="pricing-currency">R$</span>
            <span class="pricing-amount">10</span>
            <span class="pricing-cents">,90</span>
            <span class="pricing-period">/mês</span>
          </div>
          <ul class="pricing-items">
            <li v-for="item in pricingItems" :key="item"><span class="check">✓</span> {{ item }}</li>
          </ul>
          <a href="/login?tab=cadastro" class="btn-primary btn-lg pricing-cta">Começar agora</a>
          <p class="pricing-note">Cancele quando quiser, sem multa.</p>
        </div>
      </div>
    </section>

    <!-- ── CTA final ── -->
    <section class="cta-final">
      <div class="section-inner cta-inner">
        <h2>Pronto para simplificar sua documentação?</h2>
        <p>Junte-se a professores que já economizam horas por semana com o ACAE.</p>
        <a href="/login?tab=cadastro" class="btn-primary btn-lg">Criar conta grátis</a>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="footer">
      <div class="footer-inner">
        <img :src="acaeLogo" alt="ACAE" class="footer-logo" />
        <p class="footer-copy">© 2026 ACAE · Plataforma pedagógica para educação especial</p>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import acaeLogo from '@/assets/drawings/acaeLogo.png'

const features = [
  {
    emoji: '📋',
    title: 'Registros pedagógicos',
    desc: 'Organize observações por aluno e período. Histórico completo sempre acessível, pronto para virar documento.',
  },
  {
    emoji: '🤖',
    title: 'Documentos com IA',
    desc: 'Gere portfólios, relatórios individuais e resumos pedagógicos em segundos, com base nos seus próprios registros.',
  },
  {
    emoji: '📅',
    title: 'Chamada e ocorrências',
    desc: 'Controle de frequência diária e registro de ocorrências integrado ao perfil de cada aluno.',
  },
  {
    emoji: '📊',
    title: 'Avaliação Vineland-3',
    desc: 'Escala de comportamento adaptativo integrada ao perfil do aluno, com cálculo automático dos scores.',
  },
  {
    emoji: '🏫',
    title: 'Turmas e grupos',
    desc: 'Organize seus alunos em turmas e subgrupos. Crie quantas turmas precisar no mesmo plano.',
  },
  {
    emoji: '📄',
    title: 'Exportação em PDF',
    desc: 'Todos os documentos gerados podem ser exportados em PDF, prontos para entregar à coordenação.',
  },
]

const pricingItems = [
  'Registros e documentos ilimitados',
  'Geração de documentos com IA',
  'Chamada, ocorrências e Vineland',
  'Exportação em PDF',
  'Suporte por e-mail',
]
</script>

<style scoped>
/* ── Reset / base ── */
.landing {
  font-family: 'Nunito', system-ui, sans-serif;
  color: #1C2B3A;
  background: #fff;
  min-height: 100dvh;
}

a { text-decoration: none; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFCC02;
  color: #856900;
  font-weight: 700;
  border-radius: 0.625rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  transition: filter 0.15s, transform 0.15s;
  border: none;
  cursor: pointer;
}
.btn-primary:hover { filter: brightness(0.93); transform: translateY(-1px); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5A6A7E;
  font-weight: 600;
  border-radius: 0.625rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #F0F4F8; }

.btn-lg { padding: 0.75rem 1.75rem; font-size: 1rem; }

/* ── Navbar ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E8EDF4;
}
.navbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.nav-logo { height: 32px; }
.nav-links {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}
.nav-links a {
  font-size: 0.9rem;
  font-weight: 600;
  color: #5A6A7E;
  transition: color 0.15s;
}
.nav-links a:hover { color: #1C2B3A; }
.nav-actions { display: flex; gap: 0.5rem; align-items: center; }

/* ── Hero ── */
.hero {
  max-width: 1100px;
  margin: 0 auto;
  padding: 5rem 1.5rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
.hero-badge {
  display: inline-block;
  background: rgba(255, 204, 2, 0.18);
  color: #856900;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.3rem 0.875rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
}
.hero-title {
  font-size: 3rem;
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 1.25rem;
  color: #1C2B3A;
}
.hero-highlight { color: #B8860B; position: relative; }
.hero-highlight::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 204, 2, 0.45);
  border-radius: 3px;
  z-index: -1;
}
.hero-sub {
  font-size: 1.0625rem;
  color: #5A6A7E;
  line-height: 1.65;
  margin: 0 0 2rem;
  max-width: 480px;
}
.hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.hero-note { font-size: 0.8125rem; color: #9BA8B7; margin-top: 0.875rem; }

/* ── Mockup ── */
.hero-visual { display: flex; justify-content: center; }
.mockup-card {
  background: #fff;
  border: 1px solid #C8D0DA;
  border-radius: 1rem;
  padding: 1.25rem;
  width: 340px;
  box-shadow: 0 12px 48px rgba(28, 43, 58, 0.10);
}
.mockup-header { display: flex; gap: 0.375rem; margin-bottom: 1rem; }
.mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
.mockup-dot.red { background: #F25C5C; }
.mockup-dot.yellow { background: #FFCC02; }
.mockup-dot.green { background: #3DC98A; }
.mockup-row { display: flex; flex-direction: column; gap: 0.125rem; margin-bottom: 0.75rem; }
.mockup-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9BA8B7; }
.mockup-value { font-size: 0.9rem; font-weight: 600; color: #1C2B3A; }
.mockup-ai {
  margin-top: 1rem;
  background: #F0F4F8;
  border-radius: 0.625rem;
  padding: 0.75rem;
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
}
.mockup-ai-badge {
  background: #4A90E2;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
}
.mockup-ai-text { font-size: 0.8125rem; color: #5A6A7E; line-height: 1.5; font-style: italic; }

/* ── Sections ── */
.section-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 5rem 1.5rem;
  text-align: center;
}
.section-title { font-size: 2rem; font-weight: 900; margin: 0 0 0.75rem; color: #1C2B3A; }
.section-sub { font-size: 1.0625rem; color: #5A6A7E; margin: 0 0 3rem; }

/* ── Features ── */
.features { background: #F0F4F8; }
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  text-align: left;
}
.feature-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #E8EDF4;
  transition: box-shadow 0.2s, transform 0.2s;
}
.feature-card:hover { box-shadow: 0 6px 24px rgba(28, 43, 58, 0.09); transform: translateY(-2px); }
.feature-icon { font-size: 1.75rem; margin-bottom: 0.75rem; }
.feature-card h3 { font-size: 0.9375rem; font-weight: 800; margin: 0 0 0.375rem; color: #1C2B3A; }
.feature-card p { font-size: 0.875rem; color: #5A6A7E; line-height: 1.55; margin: 0; }

/* ── Pricing ── */
.pricing-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 2px solid #FFCC02;
  border-radius: 1.25rem;
  padding: 2.5rem 3rem;
  min-width: 320px;
  box-shadow: 0 8px 40px rgba(255, 204, 2, 0.18);
}
.pricing-badge {
  background: rgba(255, 204, 2, 0.18);
  color: #856900;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.3rem 1rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
}
.pricing-value {
  display: flex;
  align-items: flex-start;
  line-height: 1;
  margin-bottom: 1.75rem;
  color: #1C2B3A;
}
.pricing-currency { font-size: 1.25rem; font-weight: 700; margin-top: 0.5rem; }
.pricing-amount { font-size: 4rem; font-weight: 900; }
.pricing-cents { font-size: 1.5rem; font-weight: 700; margin-top: 0.75rem; }
.pricing-period { font-size: 1rem; color: #9BA8B7; font-weight: 500; align-self: flex-end; margin-bottom: 0.5rem; margin-left: 0.25rem; }
.pricing-items { list-style: none; padding: 0; margin: 0 0 2rem; width: 100%; text-align: left; display: flex; flex-direction: column; gap: 0.625rem; }
.pricing-items li { font-size: 0.9375rem; color: #1C2B3A; display: flex; gap: 0.625rem; }
.check { color: #3DC98A; font-weight: 800; flex-shrink: 0; }
.pricing-cta { width: 100%; }
.pricing-note { font-size: 0.8125rem; color: #9BA8B7; margin-top: 0.875rem; }

/* ── CTA final ── */
.cta-final { background: #1C2B3A; }
.cta-inner { color: #fff; display: flex; flex-direction: column; align-items: center; }
.cta-final h2 { font-size: 2rem; font-weight: 900; margin: 0 0 0.75rem; }
.cta-final p { font-size: 1.0625rem; color: #9BA8B7; margin: 0 0 2rem; }

/* ── Footer ── */
.footer { background: #1C2B3A; border-top: 1px solid rgba(255,255,255,0.07); }
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-logo { height: 24px; opacity: 0.7; }
.footer-copy { font-size: 0.8125rem; color: #9BA8B7; margin: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; padding: 3rem 1.25rem; }
  .hero-visual { display: none; }
  .hero-title { font-size: 2.125rem; }
  .features-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .pricing-card { padding: 2rem 1.5rem; min-width: unset; width: 100%; }
}
</style>
