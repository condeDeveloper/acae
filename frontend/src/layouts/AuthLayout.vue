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
  background: #f5f3ff;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(124, 58, 237, 0.12);
}
.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.auth-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7c3aed;
}
.auth-subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
