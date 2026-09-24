# LOLLIFLIX PRO 🎬

App de stream completo com foco em **Doramas, Novelas e Novelas Turcas** e **catálogo
totalmente liberado** (Filmes, Séries, TV ao vivo). Conexão Xtream Codes + **TMDB** para
organizar capas, sinopses (pt-BR), backdrops e notas. Responsivo para **todos os
dispositivos** e pronto para a **Play Store**.

- **App ID:** `com.lolliflixpro.app` • **Nome:** LOLLIFLIX PRO
- **Pasta do projeto:** `doraflix` (nome interno; o app se chama LOLLIFLIX PRO)
- **Painel:** `www/js/config.js` (`configEndpoint`)

## Recursos
- Home estilo streaming: destaque + trilhos de Doramas/Novelas/Turcas/Filmes.
- **Tema alternável**: LOLLIFLIX (vermelho) ou Doramas (rosa/roxo) — em Ajustes.
- **Configurações**: PIN de conteúdo adulto, adicionar/trocar perfil, sair.
- **Favoritar canais** (estrela) e **Favoritos organizados** por Canais/Filmes/Séries.
- Player com HLS nativo (streams ao vivo tocam) + VOD; spinner profissional.
- Ícone **adaptativo/redondo** para todos os aparelhos Android.

## PC (Windows)
```bash
cd doraflix
npm install
npm start          # rodar
npm run dist       # instalador
```

## Android (APK) — build na nuvem (sem Android Studio)
1. Suba **o conteúdo da pasta `doraflix`** para a **raiz** de um repositório no GitHub.
2. **Actions → "Build LOLLIFLIX PRO APK" → Run workflow**.
3. Baixe em **Artifacts → LOLLIFLIX-PRO-APK**, extraia o `.zip` e instale o `.apk`.

## Play Store
Permissões mínimas (Internet), sem rastreadores, dados só no aparelho, política de
privacidade em `PRIVACY.md`. Para publicar gere um **AAB assinado** (`gradlew bundleRelease`).

## Personalizar depois (sem recompilar) — MT Manager / APK Editor
- **Trocar o link do painel / nome do app:** abra o APK no **MT Manager**, vá em
  `assets/public/js/config.js`, edite as linhas `PAINEL_URL` e `NOME_APP` (entre aspas),
  salve e **assine** o APK.
- **Trocar o ícone do app:** substitua as imagens em `res/mipmap-*/ic_launcher*.png`
  e `ic_launcher_round*.png` pelo **APK Editor**, salve e assine.
- **Logo e fundo dentro do app:** vêm do **painel** (branding) — troque no painel.

## Créditos
Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
