/* Mapa de imagens das posições.
   No React Native as imagens locais precisam de require() fixo, então:
   1) salve a foto em mobile/assets/img/
   2) adicione uma linha aqui, por exemplo:
        'img/conchinha.png': require('../assets/img/conchinha.png'),
   3) em data/positions.json preencha "imagem": "img/conchinha.png"
   Também funciona colocar uma URL (https://...) direto no campo "imagem".
   Vazio = usa o emoji de "icone".
   O campo "foto" funciona igual (ex.: "img/posicoes/posicao_cachorrinho.jpg")
   e mostra a imagem grande abaixo de "Como executar". */
export default {
  'img/posicoes/posicao_cachorrinho.jpg': require('../assets/img/posicoes/posicao_cachorrinho.jpg'),
  'img/posicoes/lotus.jpg': require('../assets/img/posicoes/lotus.jpg'),
  'img/posicoes/missionario.jpg': require('../assets/img/posicoes/missionario.jpg'),
  'img/posicoes/cavalgada.jpg': require('../assets/img/posicoes/cavalgada.jpg'),
  'img/posicoes/borboleta.jpg': require('../assets/img/posicoes/borboleta.jpg'),
  'img/posicoes/cadeira.jpg': require('../assets/img/posicoes/cadeira.jpg'),
  'img/posicoes/tesoura.jpg': require('../assets/img/posicoes/tesoura.jpg'),
  'img/posicoes/parede.jpg': require('../assets/img/posicoes/parede.jpg'),
  'img/posicoes/conchinha.jpg': require('../assets/img/posicoes/conchinha.jpg'),
  'img/posicoes/arco.jpg': require('../assets/img/posicoes/arco.jpg'),
};
