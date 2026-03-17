<template>
  <div class="app-loading">
    <div class="loading-content">
      <img src="@/assets/drawings/acaeLogo.png" alt="ACAE" class="loading-logo" />
      <div class="loading-bar-track">
        <div class="loading-bar-fill" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.loading-logo {
  height: 90px;
  width: auto;
  object-fit: contain;
  animation: logo-pulse 2s ease-in-out infinite;
}

.loading-bar-track {
  width: 240px;
  height: 5px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 45%;
  background: linear-gradient(90deg, transparent, var(--acae-primary), transparent);
  border-radius: 99px;
  animation: bar-shimmer 1.6s ease-in-out infinite;
}

@keyframes bar-shimmer {
  0%   { transform: translateX(-250%); }
  100% { transform: translateX(700%); }
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.8; transform: scale(0.97); }
}
</style>
