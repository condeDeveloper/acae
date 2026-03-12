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
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 2rem;
  box-shadow: 0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08);
}
.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.auth-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--acae-primary);
}
.auth-subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-3);
  font-size: 0.875rem;
}
</style>
