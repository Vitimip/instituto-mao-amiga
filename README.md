# Instituto Mão Amiga (App Mobile — N2-3)

Aplicativo mobile em React Native (Expo) que consome a API REST Spring Boot (`Beinstituto_mao_amiga`) para listagem paginada, busca e detalhamento de pontos de coleta e distribuição, mantendo o registro de doações localmente via `AsyncStorage`.

## Estrutura de Pastas

- `src/services/api.ts`: cliente HTTP centralizado (`API_BASE_URL`, `get`, `post`, `put`, `del`) que concentra todas as chamadas `fetch` e lança `ApiError` com o `status` HTTP em respostas de erro.
- `src/services/pontosService.ts`: camada de domínio de pontos (`listar`, `buscarPagina`, `buscarPorId`, `cadastrar`, `editar`, `excluir`), sem que nenhuma tela monte URLs ou invoque `fetch`.
- `src/screens/`: telas da aplicação (`TelaListaPontos.tsx`, `TelaDetalhePonto.tsx`, `TelaCadastroDoacao.tsx`, `TelaMinhasDoacoes.tsx`, `TelaDetalheDoacao.tsx`).
- `src/components/`: componentes reutilizáveis (`PontoItem.tsx`).
- `src/storage/`: persistência local das doações (`doacoesStorage.ts` com `AsyncStorage`).
- `src/types/`: tipagens TypeScript compartilhadas (`ponto.ts`).

## Configuração da URL da API (Rede Local)

Para executar no celular físico com Expo Go na mesma rede Wi-Fi do computador onde o back-end Spring Boot está rodando:

1. Descubra o IPv4 local do computador:
   - **Windows:** execute `ipconfig` no terminal e copie o **Endereço IPv4** da placa Wi-Fi/Ethernet (ex.: `192.168.0.100`).
   - **Linux/macOS:** execute `hostname -I` ou `ifconfig`.
2. Abra `src/services/api.ts` e ajuste `API_BASE_URL` com o IP do computador (não use `localhost` ao testar no celular):
   ```ts
   export const API_BASE_URL = 'http://192.168.0.100:8080/api/v1';
   ```
3. Inicie o back-end Spring Boot (`./mvnw spring-boot:run`) na porta `8080`.
4. Instale as dependências e inicie o Expo:
   ```bash
   npm install
   npx expo start
   ```
