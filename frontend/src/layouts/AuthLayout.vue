<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Portal do Professor</h1>
        <p class="auth-subtitle">ACAE</p>
      </div>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 2px solid var(--border);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.10);
}
.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.auth-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--text-1);
  font-family: 'Nunito', sans-serif;
}
.auth-subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-2);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
