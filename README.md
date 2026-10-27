<<<<<<< HEAD
# FHOSutra – app mobile (HTML + CSS + JS + JSON)

```
fhosutra/
├── README.md
└── www/                  <- o app inteiro
    ├── index.html        (telas e estrutura)
    ├── manifest.json     (permite "instalar" como app)
    ├── css/style.css     (cores e visual; variáveis no topo)
    ├── js/app.js         (lógica: questionário, roleta, timer)
    ├── data/positions.json  (as 10 posições)
    ├── data/quiz.json       (perguntas do questionário)
    └── img/              (suas imagens)
```

## 1. Rodar no PC (VS Code)
1. Instale o VS Code (code.visualstudio.com).
2. Abra a pasta `fhosutra` (Arquivo > Abrir Pasta).
3. Aba Extensões (Ctrl+Shift+X) > instale **Live Server** (Ritwick Dey).
4. Botão direito em `www/index.html` > **Open with Live Server**. Abre em `http://127.0.0.1:5500`.
5. No navegador: F12, depois Ctrl+Shift+M (modo dispositivo) para ver como no celular.

Atenção: não dê duplo clique no index.html. O navegador bloqueia a leitura dos .json fora de um servidor.

## 2. Levar para o celular
**A) Teste rápido (Android e iPhone):** com PC e celular no mesmo Wi-Fi, abra no celular `http://IP_DO_PC:5500/www/index.html` (descubra o IP com `ipconfig` no Windows). Depois: Chrome (Android) > menu > *Adicionar à tela inicial*; Safari (iPhone) > Compartilhar > *Adicionar à Tela de Início*.

**B) App de verdade com Capacitor** (instale o Node.js em nodejs.org). No terminal do VS Code, dentro de `fhosutra`:
```
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init FHOSutra com.fhosutra.app --web-dir=www
npx cap add android
npx cap sync
npx cap open android      # abre o Android Studio: ligue o celular com depuração USB e clique em Run
```
- **iPhone:** só é possível em um Mac com Xcode: `npm i @capacitor/ios`, `npx cap add ios`, `npx cap sync`, `npx cap open ios`, depois Run.
- Sempre que editar a pasta `www`, rode `npx cap sync` antes de testar de novo.

## 3. Como editar
- **Nova posição:** copie um bloco em `data/positions.json`, mude o `id` (sem espaços) e os textos. Dificuldade e flexibilidade vão de 1 a 3; `controle` e `intensidade` de 0 a 1 (usados na recomendação). Ela aparece na lista e na roleta sozinha. Coloque o `id` nas `parecidas` de outras posições para virar tag clicável.
- **Imagens:** salve em `www/img/` e preencha `"imagem": "img/minha-foto.png"`. Vazio = usa o emoji de `icone`.
- **Perguntas:** edite `data/quiz.json`. Cada pergunta tem um `eixo` (controle, intensidade, dificuldade ou flexibilidade) e opções com `valor` de 0 a 1.
- **Nova seção:** em `index.html`, copie uma `<div class="aba">` (com id `aba-NOME`) e um botão no `<nav>` com `data-aba="NOME"`.
- **Cores:** variáveis no começo de `css/style.css`.
- **Objetivos:** cada posição tem `"objetivos": ["Carinho", "Intimidade"]` no JSON. Eles viram tags na tela da posição e os botões de filtro da aba Explorar (novos objetivos aparecem sozinhos).
- **Ordem das abas e telas:** menu inferior em `index.html` (`<nav>`). O botão ← Voltar é controlado por `voltar()` em `js/app.js`.
=======
# Projeto-Aventura-Ocidental
Trabalho de Programação Mobile do curso de Engenharia da Computação em andamento.
>>>>>>> 56e53e0571e2d3ddbc01018a91f6ec7f624957ec
