const app = document.querySelector(".app");
buscarEExibirQuizzes();

// ============ FUNÇÔES DA TELA 1: LISTA DE QUIZZES ============ //

let quizzesDoUsuario = [];
let todosQuizzes = [];

function buscarEExibirQuizzes() {
  app.scrollTo(0, 0);
  const requisicao = axios.get(
    "https://mock-api.bootcamp.respondeai.com.br/api/v6/buzzquizz/quizzes"
  );

  requisicao.then(separarERenderizarQuizzes);
  requisicao.catch(erroAoBuscarQuizzes);
}

function separarERenderizarQuizzes(resposta) {
  const quizzesServidor = resposta.data;
  const quizzesSeparados = separarQuizzesDoUsuario(quizzesServidor);

  quizzesDoUsuario = quizzesSeparados.usuario;
  todosQuizzes = quizzesSeparados.todos;

  renderizarQuizzes();
}

function erroAoBuscarQuizzes() {
  alert("Erro ao buscar quizzes! Por favor, recarregue a página.");
}

function separarQuizzesDoUsuario(listaDeQuizzes) {
  const quizzesSeparados = {
    usuario: [],
    todos: []
  };

  for (let i = 0; i < listaDeQuizzes.length; i++) {
    const quizz = listaDeQuizzes[i];

    if (quizzPertenceAoUsuario(quizz)) {
      quizzesSeparados.usuario.push(quizz);
    } else {
      quizzesSeparados.todos.push(quizz);
    }
  }

  return quizzesSeparados;
}

function quizzPertenceAoUsuario(quizz) {
  const quizzesDoUsuario = obterQuizzesPersistidos();

  for (let i = 0; i < quizzesDoUsuario.length; i++) {
    if (quizzesDoUsuario[i].id === quizz.id) {
      return true;
    }
  }

  return false;
}

function obterQuizzesPersistidos() {
  let dados = localStorage.getItem("quizzes");

  if (dados !== null) {
    const dadosDeserializados = JSON.parse(dados);
    return dadosDeserializados;
  } else {
    return [];
  }
}

function renderizarQuizzes() {
  let quizzesUsuarioHTML = "";

  if (quizzesDoUsuario.length === 0) {
    quizzesUsuarioHTML = gerarCardCriacaoQuizz();
  } else {
    quizzesUsuarioHTML = gerarCardsQuizzesDoUsuario();
  }

  let todosQuizzesHTML = "";
  todosQuizzes.forEach(function (quizz) {
    todosQuizzesHTML += gerarCardQuizz(quizz);
  });

  app.innerHTML = `
    <div class="pagina-lista-quizzes">
      <div class="quizzes usuario">
        ${quizzesUsuarioHTML}
      </div>

      <div class="quizzes todos">
        <div class="cabecalho">
          <div class="titulo">Todos os Quizzes</div>
        </div>
        <div class="lista-quizzes">
          ${todosQuizzesHTML}
        </div>
      </div>
    </div>
  `;
}

function gerarCardCriacaoQuizz() {
  return `
    <div class="criar-quizz">
      <div class="conteudo">Você não criou nenhum<br> quizz ainda :(</div>
      <button onclick="exibirCriarQuizz()">Criar Quizz</button>
    </div>
  `;
}

function gerarCardsQuizzesDoUsuario() {
  let listaQuizzes = "";

  quizzesDoUsuario.forEach(function (quizz) {
    listaQuizzes += gerarCardQuizz(quizz);
  });

  return `
    <div class="cabecalho">
      <div class="titulo">Seus Quizzes</div>
      <button onclick="exibirCriarQuizz()">+</button>
    </div>
    <div class="lista-quizzes">
      ${listaQuizzes}
    </div>
  `;
}

function gerarCardQuizz(quizz) {
  return `
    <div class="quizz" onclick="exibirQuizz(${quizz.id})">
      <img src="${quizz.image}">
      <div class="overlay"></div>
      <div class="titulo">${quizz.title}</div>
    </div>
  `;
}

// ============ FUNÇÔES DA TELA 2: TELA DE UM QUIZZ ============ //

let quizzAtual = {};
let contadorPerguntasRespondidas = 0;
let contadorRespostasCorretas = 0;

function exibirQuizz(id) {
  contadorRespostasCorretas = 0;
  contadorPerguntasRespondidas = 0;

  app.scrollTo(0, 0);

  const requisicao = axios.get(
    `https://mock-api.bootcamp.respondeai.com.br/api/v6/buzzquizz/quizzes/${id}`
  );

  requisicao.then(renderizarQuizz);
}

function renderizarQuizz(resposta) {
  const quizz = resposta.data;
  quizzAtual = quizz;

  let perguntas = "";

  quizz.questions.forEach(function (pergunta, indice) {
    perguntas += gerarCardPergunta(pergunta, indice);
  });

  app.innerHTML = `
    <div class="banner">
      <img src="${quizz.image}">
      <div class="titulo">${quizz.title}</div>
    </div>

    <div class="perguntas">
      ${perguntas}
    </div>

    <div class="nivel"></div>
  `;
}

function gerarCardPergunta(pergunta, indice) {
  function aleatorizar() {
    return Math.random() - 0.5;
  }

  pergunta.answers.sort(aleatorizar);

  let respostas = "";

  pergunta.answers.forEach(function (resposta) {
    respostas += gerarCardResposta(resposta, indice);
  });

  return `
    <div class="pergunta pergunta-${indice}">
      <div class="titulo" style="background-color: ${pergunta.color}">
        ${pergunta.title}
      </div>
      <div class="respostas">
        ${respostas}
      </div>
    </div>
  `;
}

function gerarCardResposta(resposta, indice) {
  let classe = "incorreta";
  if (resposta.isCorrectAnswer) classe = "correta";

  return `
    <div class="resposta ${classe}" onclick="escolherResposta(this, ${resposta.isCorrectAnswer}, ${indice})">
      <img src="${resposta.image}">
      <div class="texto">${resposta.text}</div>
    </div>
  `;
}

function escolherResposta(elemento, correta, indicePergunta) {
  const containerRespostas = elemento.parentNode;

  // impedindo que uma pergunta já respondida seja respondida de novo
  if (containerRespostas.classList.contains("respondido")) {
    return;
  }

  contadorPerguntasRespondidas += 1;

  if (correta) {
    contadorRespostasCorretas += 1;
  }

  // quando o elemento pai tem a classe respondido as respostas recebem as cores
  containerRespostas.classList.add("respondido");

  // colocando transparência no restante
  const respostas = containerRespostas.querySelectorAll(".resposta");

  for (let i = 0; i < respostas.length; i++) {
    const resposta = respostas[i];

    if (elemento !== resposta) {
      resposta.classList.add("transparente");
    }
  }

  if (contadorPerguntasRespondidas !== quizzAtual.questions.length) {
    if (indicePergunta !== quizzAtual.questions.length - 1) {
      const proximaPergunta = document.querySelector(
        `.pergunta-${indicePergunta + 1}`
      );
      scrollarParaElemento(proximaPergunta);
    }
  } else {
    calcularEExibirNivel();
    const nivel = document.querySelector(".nivel");
    scrollarParaElemento(nivel);
  }
}

function scrollarParaElemento(elemento) {
  function scroll() {
    elemento.scrollIntoView({ behavior: "smooth" });
  }

  setTimeout(scroll, 2000);
}

function calcularEExibirNivel() {
  const elementoNivel = document.querySelector(".nivel");

  function ordenarNiveisDecrescente(a, b) {
    return b.minValue - a.minValue;
  }

  quizzAtual.levels.sort(ordenarNiveisDecrescente);

  const nivelAtingido = Math.round(
    (contadorRespostasCorretas / quizzAtual.questions.length) * 100
  );

  for (let i = 0; i < quizzAtual.levels.length; i++) {
    const nivel = quizzAtual.levels[i];

    if (nivel.minValue <= nivelAtingido) {
      elementoNivel.innerHTML = `
        <div class="titulo">
          ${nivelAtingido}% de acerto: ${nivel.title}
        </div>
        <div class="conteudo">
          <img src="${nivel.image}">
          <div class="texto">${nivel.text}</div>
        </div>

        <button class="reiniciar" onclick="reiniciarQuizz()">Reiniciar Quizz</button>
        <button class="voltar" onclick="buscarEExibirQuizzes()">Voltar pra home</button>
      `;

      break;
    }
  }
}

function reiniciarQuizz() {
  const banner = document.querySelector(".banner");
  banner.scrollIntoView({ behavior: "smooth" });
  exibirQuizz(quizzAtual.id);
}

// ============ FUNÇÔES DA TELA 3: CRIAÇÂO DE UM QUIZZ ============ //

let quizzCriado;

function exibirCriarQuizz() {
  quizzCriado = {
    title: "",
    image: "",
    quantidadePerguntas: 0,
    quantidadeNiveis: 0,
    questions: [],
    levels: []
  };

  app.innerHTML = `
    <div class="pagina-criar-quizz">
      <div class="titulo">Comece pelo começo</div>
      <div class="entradas">
        <input type="text" class="titulo" placeholder="Título do seu quizz">
        <input type="text" class="url" placeholder="URL da imagem do seu quizz">
        <input type="number" class="quantidade-perguntas" placeholder="Quantidade de perguntas do quizz">
        <input type="number" class="quantidade-niveis" placeholder="Quantidade de níveis do quizz">
      </div>
      <button class="prosseguir" onclick="exibirCriarPerguntas()">Prosseguir pra criar perguntas</button>
    </div>
  `;
}

function validarURL(url) {
  const regra = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
  return regra.test(url);
}

function registrarValoresIniciaisQuizz() {
  const titulo = document.querySelector(".entradas .titulo").value;
  const imagem = document.querySelector(".entradas .url").value;
  const quantidadePerguntas = document.querySelector(
    ".entradas .quantidade-perguntas"
  ).value;
  const quantidadeNiveis = document.querySelector(
    ".entradas .quantidade-niveis"
  ).value;

  quizzCriado.title = titulo;
  quizzCriado.image = imagem;
  quizzCriado.quantidadePerguntas = parseInt(quantidadePerguntas);
  quizzCriado.quantidadeNiveis = parseInt(quantidadeNiveis);
}

function validarDadosIniciaisQuizz() {
  registrarValoresIniciaisQuizz();

  if (quizzCriado.title.length < 20 || quizzCriado.title.length > 65) {
    return false;
  } else if (!validarURL(quizzCriado.image)) {
    return false;
  } else if (quizzCriado.quantidadePerguntas < 3) {
    return false;
  } else if (quizzCriado.quantidadeNiveis < 2) {
    return false;
  }

  return true;
}

function exibirCriarPerguntas() {
  const valido = validarDadosIniciaisQuizz();
  if (!valido) {
    alert("Preencha os campos corretamente!");
    return;
  }

  let perguntas = "";

  for (let i = 0; i < quizzCriado.quantidadePerguntas; i++) {
    perguntas += gerarCardCriarPergunta(i);
  }

  app.innerHTML = `
    <div class="pagina-criar-quizz">
      <div class="titulo">Crie suas perguntas</div>

      ${perguntas}

      <button class="prosseguir" onclick="exibirCriarNiveis()">Prosseguir para criar níveis</button>
    </div>
  `;
}

function gerarCardCriarPergunta(indice) {
  let classe = "";

  if (indice === 0) {
    classe = "expandido";
  }

  return `
    <div class="pergunta entradas ${classe}">
      <div class="titulo-card">
        <div class="label">Pergunta ${indice + 1}</div>
        <div class="toggle" onclick="expandirCard(this)">
          <ion-icon name="create-outline"></ion-icon>
        </div>
      </div>

      <div class="corpo-card">
        <input type="text" class="pergunta-${indice}-texto" placeholder="Texto da pergunta" />
        <input type="text" class="pergunta-${indice}-cor" placeholder="Cor de fundo da pergunta" />

        <div class="label">Resposta correta</div>

        <div class="grupo">
          <input type="text" class="pergunta-${indice}-resposta-correta" placeholder="Resposta correta" />
          <input type="text" class="pergunta-${indice}-url-correta" placeholder="URL da imagem" />
        </div>

        <div class="label">Respostas incorretas</div>

        <div class="grupo pergunta-${indice}-incorreta-0">
          <input type="text" class="resposta" placeholder="Resposta incorreta 1" />
          <input type="text" class="url" placeholder="URL da imagem 1" />
        </div>

        <div class="grupo pergunta-${indice}-incorreta-1">
          <input type="text" class="resposta" placeholder="Resposta incorreta 2" />
          <input type="text" class="url" placeholder="URL da imagem 2" />
        </div>

        <div class="grupo pergunta-${indice}-incorreta-2">
          <input type="text" class="resposta" placeholder="Resposta incorreta 3" />
          <input type="text" class="url" placeholder="URL da imagem 3" />
        </div>
      </div>
    </div>
  `;
}

function expandirCard(elemento) {
  const expandido = document.querySelector(".expandido");
  expandido.classList.remove("expandido");

  elemento.parentNode.parentNode.classList.add("expandido");
}

function registrarPerguntasQuizz() {
  quizzCriado.questions = [];

  for (let i = 0; i < quizzCriado.quantidadePerguntas; i++) {
    const pergunta = {};

    pergunta.title = document.querySelector(`.pergunta-${i}-texto`).value;
    pergunta.color = document.querySelector(`.pergunta-${i}-cor`).value;

    pergunta.answers = [];

    const respostaCorreta = {
      text: document.querySelector(`.pergunta-${i}-resposta-correta`).value,
      image: document.querySelector(`.pergunta-${i}-url-correta`).value,
      isCorrectAnswer: true
    };

    pergunta.answers.push(respostaCorreta);

    for (let j = 0; j < 3; j++) {
      const resposta = {
        text: document.querySelector(`.pergunta-${i}-incorreta-${j} .resposta`)
          .value,
        image: document.querySelector(`.pergunta-${i}-incorreta-${j} .url`)
          .value,
        isCorrectAnswer: false
      };

      if (resposta.text.length === 0) {
        continue;
      }

      pergunta.answers.push(resposta);
    }

    quizzCriado.questions.push(pergunta);
  }
}

function validarCor(cor) {
  const regra = /^\#([0-9]|[A-F]|[a-f]){6}$/;
  return regra.test(cor);
}

function validarDadosPerguntas() {
  registrarPerguntasQuizz();

  for (let i = 0; i < quizzCriado.questions.length; i++) {
    const pergunta = quizzCriado.questions[i];

    if (pergunta.title.length < 20) {
      return false;
    } else if (!validarCor(pergunta.color)) {
      return false;
    }

    if (pergunta.answers.length < 2) {
      return false;
    }

    for (let j = 0; j < pergunta.answers.length; j++) {
      const resposta = pergunta.answers[j];

      if (resposta.text.length === 0) {
        return false;
      } else if (!validarURL(resposta.image)) {
        return false;
      }
    }
  }

  return true;
}

function exibirCriarNiveis() {
  const valido = validarDadosPerguntas();

  if (!valido) {
    alert("Preencha os dados corretamente!");
    return;
  }

  let niveis = "";

  for (let i = 0; i < quizzCriado.quantidadeNiveis; i++) {
    niveis += gerarCardCriarNivel(i);
  }

  app.innerHTML = `
    <div class="pagina-criar-quizz">
      <div class="titulo">Agora, decida os níveis</div>

      ${niveis}

      <button class="prosseguir" onclick="finalizarQuizz()">Finalizar Quizz</button>
    </div>
  `;
}

function gerarCardCriarNivel(indice) {
  let classe = "";

  if (indice === 0) classe = "expandido";

  return `
    <div class="nivel entradas ${classe}">
      <div class="titulo-card">
        <div class="label">Nível ${indice + 1}</div>
        <div class="toggle" onclick="expandirCard(this)">
          <ion-icon name="create-outline"></ion-icon>
        </div>
      </div>

      <div class="corpo-card">
        <input type="text" class="nivel-${indice}-titulo" placeholder="Título do nível" />
        <input type="number" class="nivel-${indice}-acerto" placeholder="% de acerto mínima" />
        <input type="text" class="nivel-${indice}-url" placeholder="URL da imagem do nível" />
        <input type="text" class="nivel-${indice}-descricao" placeholder="Descrição do nível" />
      </div>
    </div>
  `;
}

function registrarDadosNiveis() {
  quizzCriado.levels = [];

  for (let i = 0; i < quizzCriado.quantidadeNiveis; i++) {
    const nivel = {
      title: document.querySelector(`.nivel-${i}-titulo`).value,
      minValue: parseInt(document.querySelector(`.nivel-${i}-acerto`).value),
      image: document.querySelector(`.nivel-${i}-url`).value,
      text: document.querySelector(`.nivel-${i}-descricao`).value
    };

    quizzCriado.levels.push(nivel);
  }
}

function validarDadosNiveis() {
  registrarDadosNiveis();
  let temNivel0 = false;

  for (let i = 0; i < quizzCriado.levels.length; i++) {
    const nivel = quizzCriado.levels[i];

    if (nivel.minValue === 0) {
      temNivel0 = true;
    }

    if (nivel.title.length < 10) {
      return false;
    } else if (nivel.minValue < 0 || nivel.minValue > 100) {
      return false;
    } else if (!validarURL(nivel.image)) {
      return false;
    } else if (nivel.text.length < 30) {
      return false;
    }
  }

  return temNivel0;
}

function finalizarQuizz() {
  const valido = validarDadosNiveis();

  if (!valido) {
    alert("Preencha os dados corretamente!");
    return;
  }

  salvarQuizz();
}

function salvarQuizz() {
  const dados = {
    title: quizzCriado.title,
    image: quizzCriado.image,
    questions: quizzCriado.questions,
    levels: quizzCriado.levels
  };

  const requisicao = axios.post(
    "https://mock-api.bootcamp.respondeai.com.br/api/v6/buzzquizz/quizzes",
    dados
  );

  requisicao.then(salvarQuizzNoLocalStorage);
}

function salvarQuizzNoLocalStorage(resposta) {
  const quizz = resposta.data;

  const dadosLocalStorage = obterQuizzesPersistidos();

  dadosLocalStorage.push({
    id: quizz.id,
    key: quizz.key
  });

  localStorage.setItem("quizzes", JSON.stringify(dadosLocalStorage));

  exibirSucesso(quizz.id);
}

function exibirSucesso(id) {
  app.innerHTML = `
    <div class="pagina-criar-quizz">
      <div class="titulo">Seu quizz está pronto!</div>

      <div class="quizz" onclick="exibirQuizz(${id})">
        <img src="${quizzCriado.image}">
        <div class="overlay"></div>
        <div class="titulo">${quizzCriado.title}</div>
      </div>

      <button class="acessar-quizz" onclick="exibirQuizz(${id})">Acessar Quizz</button>
      <button class="voltar" onclick="buscarEExibirQuizzes()">Voltar pra home</button>
    </div>
  `;
}
