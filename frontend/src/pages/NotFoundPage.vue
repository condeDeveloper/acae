<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Página não encontrada.</p>
    <RouterLink to="/">Voltar ao início</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 2rem;
}
.not-found h1 {
  font-size: 4rem;
  color: var(--acae-primary, #FFCC02);
  margin: 0;
  font-family: 'Nunito', sans-serif;
  font-weight: 900;
}
</style>
