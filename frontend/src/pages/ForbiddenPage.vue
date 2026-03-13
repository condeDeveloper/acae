<template>
  <div class="forbidden">
    <h1>403</h1>
    <p>Você não tem permissão para acessar esta página.</p>
    <RouterLink to="/">Voltar ao início</RouterLink>
  </div>
</template>

<style scoped>
.forbidden {
  text-align: center;
  padding: 4rem 2rem;
}
.forbidden h1 {
  font-size: 4rem;
  color: var(--acae-primary, #FFCC02);
  margin: 0;
  font-family: 'Nunito', sans-serif;
  font-weight: 900;
}
</style>
