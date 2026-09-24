/* ==================================================================
   LOLLIFLIX PRO - CONFIGURACAO
   ------------------------------------------------------------------
   >>> PARA MUDAR O PAINEL: troque apenas o valor de PAINEL_URL abaixo. <<<

   Como editar direto no APK (sem recompilar):
     1) Abra o APK no MT Manager (ou APK Editor).
     2) Va em: assets  ->  public  ->  js  ->  config.js
     3) Edite a linha PAINEL_URL (deixe entre aspas). Salve.
     4) Assine o APK (o MT Manager assina) e instale.

   Icones / imagem do app (via APK Editor / MT Manager):
     - Icone do app:  res/mipmap-*/ic_launcher*.png  e  ic_launcher_round*.png
     - Splash:        res/drawable*/  (splash)
     (A LOGO e o FUNDO dentro do app vem do painel - troque no painel.)
   ================================================================== */

// >>>>>>>>>>>>>>>>>>>>>>  LINK DO PAINEL (EDITE AQUI)  <<<<<<<<<<<<<<<<<<<<
var PAINEL_URL = 'https://lolliflixsmarts.dexdown.shop/api2.php?cliente=admin';
// >>>>>>>>>>>>>>>>>>>>>>  NOME DO APP (EDITE AQUI)     <<<<<<<<<<<<<<<<<<<<
var NOME_APP = 'LOLLIFLIX PRO';

window.APP_CONFIG = {
  brand: NOME_APP,
  configEndpoint: PAINEL_URL,

  defaultTheme: 'red',      // 'red' (vermelho) ou 'dora' (rosa/roxo)
  defaultLayout: 'rails',   // 'rails' (streaming) ou 'tiles' (ladrilhos)

  requestTimeoutMs: 20000,
  maxProfiles: 5,

  // TMDB - organiza capas/sinopses/backdrops/notas (troque pela sua chave se quiser)
  tmdb: {
    apiKey: 'e07c33cf263be9cdd38872ebc7389ffc',
    language: 'pt-BR',
    base: 'https://api.themoviedb.org/3',
    img: 'https://image.tmdb.org/t/p/'
  },

  // Palavras-chave para destacar as secoes na home
  keywords: {
    turca:  ['turc', 'turq', 'otoman', 'turkish', 'turquia'],
    dorama: ['dorama', 'k-drama', 'kdrama', 'coreano', 'coreana', 'asiatic', 'oriental', 'chines', 'japon', 'tailand'],
    novela: ['novela', 'telenovela']
  },

  // conteudo adulto (bloqueio opcional por PIN)
  adultKeywords: ['adult', 'adulto', 'xxx', 'porn', '+18', '18+', 'erotic', 'sexy', 'sex', 'porno']
};
