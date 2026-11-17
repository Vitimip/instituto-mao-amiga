# Instituto Mão Amiga (App Mobile — N2-8)

Aplicativo mobile em React Native (Expo) que consome a API REST Spring Boot (`https://github.com/Vitimip/Beinstituto_mao_amiga`) para listagem paginada, busca, cadastro, edição e exclusão de pontos de coleta e distribuição, registro de doações e favoritos locais.

Só para pontuar uma funcionalidade que é extra que não funciona:
Registrar doação nesse ponto não funciona

## Estrutura de Pastas

- `src/services/api.ts`: cliente HTTP centralizado (`API_BASE_URL`, `get`, `post`, `put`, `del`) que concentra todas as chamadas `fetch` e lança `ApiError` com o `status` HTTP em respostas de erro.
- `src/services/pontosService.ts`: camada de domínio de pontos (`listar`, `buscarPagina`, `buscarPorId`, `cadastrar`, `editar`, `excluir`).
- `src/services/doacoesService.ts`: camada de domínio de doações (`listarPagina`, `buscarPorId`, `cadastrar`, `editar`, `excluir`).
- `src/screens/`: telas da aplicação (`TelaListaPontos`, `TelaDetalhePonto`, `TelaCadastroPonto`, `TelaCadastroDoacao`, `TelaMinhasDoacoes`, `TelaDetalheDoacao`, `TelaMeusPontos`).
- `src/components/`: componentes reutilizáveis (`PontoItem` com botão de favorito ♡/♥).
- `src/storage/`: persistência local (`doacoesStorage.ts` para doações, `favoritosStorage.ts` para IDs de favoritos).
- `src/types/`: tipagens TypeScript compartilhadas (`ponto.ts`, `doacao.ts`).

## Pré-requisitos

| Ferramenta | Versão mínima | Onde verificar |
|---|---|---|
| Java (JDK) | 17 | `java -version` |
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| Android Studio (emulador) ou celular com Expo Go | — | — |

## Como rodar a API (Spring Boot)

A API back-end (`Beinstituto_mao_amiga`) é um projeto Spring Boot separado. Para iniciá-la:

```bash
# No diretório do projeto Spring Boot
./mvnw spring-boot:run
```

A API inicia na porta `8080` e expõe os endpoints em `/api/v1/pontos` e `/api/v1/doacoes`.

### Onde trocar o IP

Abra `src/services/api.ts` e altere `API_BASE_URL` para o IP do computador onde a API está rodando:

```ts
export const API_BASE_URL = 'http://192.168.0.100:8080/api/v1';
```

**Importante:** use o IP local do computador (não `localhost`) ao testar no celular físico. Descubra o IP com:
- **Windows:** `ipconfig` → Endereço IPv4
- **Linux/macOS:** `hostname -I`

## Como rodar o app

```bash
npm install
npx expo start
```

- No **emulador Android**: pressione `a`.
- No **celular físico**: escaneie o QR code com o Expo Go.
- No **navegador**: pressione `w`.

## Favoritos

Os favoritos ficam salvos no aparelho (AsyncStorage) com apenas os IDs dos pontos. Ao abrir a tela "Meus pontos", o app busca os dados completos de cada favorito na API. Se um ponto foi excluído do servidor, ele é removido automaticamente da lista de favoritos sem quebrar a tela.

### Decisão técnica: por que favoritos no aparelho?

Os favoritos são uma preferência pessoal do usuário, sem necessidade de sincronização entre dispositivos ou persistência no servidor. Guardá-los no AsyncStorage:
- **Não exige** endpoint extra na API nem tabela no banco.
- **Funciona offline** — o usuário vê seus favoritos mesmo sem conexão.
- **É instantâneo** — sem round-trip ao servidor para marcar/desmarcar.
Já os pontos e doações vivem no servidor porque são dados compartilhados entre todos os usuários e precisam de consistência centralizada.

## Roteiro de demonstração (até 3 minutos)

1. **Buscar um ponto** — na tela inicial, digite no campo de busca e veja os resultados filtrados.
2. **Cadastrar um ponto** — toque em "+ Novo ponto", preencha nome, endereço, bairro, horário e tipo, e salve.
3. **Editar um ponto** — abra um ponto na lista, toque em "Editar ponto", altere um campo e salve.
4. **Excluir um ponto** — abra um ponto, toque em "Excluir ponto" e confirme.
5. **Favoritar um ponto** — na lista, toque no ♡ de um ponto (vira ♥). Abra "Meus pontos" e veja o favorito listado. Desmarque-o diretamente na tela "Meus pontos".
6. **Cadastrar uma doação** — toque em "Registrar doação", preencha tipo, quantidade e ponto de destino.
7. **Editar e excluir uma doação** — em "Minhas doações", abra uma doação, edite-a e depois exclua-a.
8. **Erros da API** — desligue a API e tente carregar a lista (erro de conexão). Tente cadastrar um ponto com campos vazios (erro 400). Abra um ponto que não existe (erro 404).
