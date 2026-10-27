# FHOSutra – versão React Native (Expo)

## Rodar no celular com o Expo Go
1. Instale o **Expo Go** no celular (Play Store / App Store) — precisa ser a versão compatível com o **SDK 58**.
2. No PC, abra um terminal nesta pasta (`mobile`) e rode:
   ```
   npx expo start
   ```
   > No PowerShell, se aparecer erro de "execução de scripts desabilitada", use `npx.cmd expo start`.
3. Com PC e celular no **mesmo Wi-Fi**, escaneie o QR Code (Android: pelo Expo Go; iPhone: pela Câmera).
   Se a rede bloquear a conexão, use `npx expo start --tunnel`.

## Estrutura
```
mobile/
├── App.js              (ponto de entrada)
├── app.json            (nome, ícone, cores do app)
└── src/
    ├── Main.js         (telas, navegação, questionário, filtros)
    ├── Roleta.js       (roleta + timer)
    ├── components.js   (botões, tags, medidores, cartão, detalhe)
    ├── theme.js        (cores)
    ├── imagens.js      (mapa de imagens das posições)
    └── data/
        ├── positions.json
        └── quiz.json
```

## Como editar
- **Posições / perguntas:** mesmas regras do README principal, mas os arquivos ficam em `src/data/`.
- **Imagens:** salve em `assets/img/`, registre em `src/imagens.js` e preencha `"imagem"` no JSON.
- **Cores:** `src/theme.js`.
