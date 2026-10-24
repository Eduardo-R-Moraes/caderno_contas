# 2026-10-24 — Editar as configurações de uma configuração salva

## O pedido
Poder mudar as configurações (operações, ranges, ordem, duração, candidatas) de uma configuração que já foi salva. Antes, depois de salva, só o nome podia mudar. Para treinar outros números era preciso usar "Duplicar e editar", e a cópia começava com o caderninho e a evolução zerados.

## A decisão principal
O app travava as configurações de propósito, para que os pontos de uma configuração sempre pudessem ser comparados entre si. Liberar a edição quebra essa garantia. Por isso, a pergunta era o que fazer com o histórico ao editar.

Opções consideradas:
- manter tudo, sem marca;
- manter tudo e marcar a edição nos gráficos;
- zerar só a evolução;
- zerar tudo.

**Escolhida: manter tudo e marcar.**
- O caderninho continua válido. Ele é indexado por conta (`sum:7:8`): as contas que saem do range só deixam de ser sorteadas, e as novas entram como "nova".
- A evolução também fica, mas os gráficos mostram onde a configuração mudou. Assim, quem olha não compara sem querer pontos de configurações diferentes.

## Mudanças, arquivo por arquivo

### `src/lib/types.ts`
- Novo campo opcional `edits?: number[]` em `Preset`: os momentos em que as settings foram editadas.
  - **Por quê:** é o mínimo para saber onde desenhar a marca nos gráficos. Como é opcional, as configurações já salvas no `localStorage` continuam funcionando sem migração.
- O comentário de `settings` dizia "não muda depois de criada". Foi atualizado, porque deixou de ser verdade.

### `src/lib/presets.ts`
- Nova função `editPreset(list, id, name, settings, now)`, no mesmo estilo de `renamePreset`: devolve uma lista nova, e quem chama salva.
  - Troca o nome (com `trim`) e as settings (com `structuredClone`, como `createPreset`, para não compartilhar referência com o formulário).
  - Mantém `stats` e `scores`, conforme a decisão acima.
  - Só acrescenta a data em `edits` se as settings mudaram de fato (a comparação usa `JSON.stringify`).
  - **Por quê:** mudar só o nome, ou salvar sem mudar nada, não afeta a comparação dos pontos e não deve criar uma marca falsa no gráfico.

### `src/components/SetupScreen.tsx`
- Nova prop opcional `editId`. Com ela, a tela serve tanto para criar quanto para editar.
  - **Por quê:** o formulário (`toDraft` / `readSetupForm` em `setupForm.ts`) já aceita qualquer `Settings` de base. Criar uma segunda tela seria duplicar código.
- Com `editId`, o título passa a ser "Editar configuração".
- A validação de nome recebe `editId` (`validateName(presets, name, editId)`).
  - **Por quê:** sem isso, o próprio nome da configuração seria acusado como repetido. `validateName` já aceitava esse parâmetro.
- O texto "Depois de salva, só o nome pode mudar…" mudou:
  - na edição, explica que os dados são mantidos e que os gráficos marcam a mudança;
  - na criação, diz que dá para editar depois.
  - **Por quê:** o texto antigo ficou falso.

### `src/App.tsx`
- Nova tela `'edit'`. Ela renderiza `SetupScreen` com as settings e o nome da configuração atual. Salvar chama `editPreset` e volta ao detalhe; cancelar volta ao detalhe sem mudar nada.
- O `PresetDetail` recebe `onEdit`, que abre essa tela.
  - **Por quê:** é o mesmo padrão das outras telas (`update(list => …)`, que já grava no `localStorage`).

### `src/components/PresetDetail.tsx`
- Novo botão **Editar configurações** (`#btn-edit`) no painel "Configuração".
- O botão "Duplicar e editar" agora se chama **Duplicar**.
  - **Por quê:** com um botão "Editar" ao lado, "Duplicar e editar" ficava confuso.
- O texto de ajuda agora explica a diferença: editar mantém o caderninho e a evolução, duplicar cria uma cópia zerada.
- Cálculo das marcas (`breaks`): para cada edição, encontra a primeira partida jogada depois dela.
  - Só entram as edições que caem entre duas partidas (índice > 0). Uma edição antes da primeira partida não separa nada.
  - Uma edição depois da última partida só aparece quando a próxima partida for jogada.
  - Índices repetidos são removidos, para várias edições seguidas sem partida entre elas virarem uma marca só.
- Uma legenda "Linha tracejada: configuração editada." aparece acima dos gráficos quando há marcas.

### `src/components/ScoreChart.tsx`
- Nova prop opcional `breaks`. Para cada índice `i`, o gráfico desenha uma linha vertical tracejada entre a partida `i-1` e a `i`.
- O texto do `aria-label` também cita as edições ("Configuração editada antes da partida N").
  - **Por quê:** quem usa leitor de tela também precisa saber da mudança.

### `src/style.css`
- Nova regra `.chart .edit`: linha tracejada na cor `--muted`, junto das regras `.grid` e `.cross` do gráfico.
  - **Por quê:** fica visível sem competir com a linha de pontos (cor `--accent`).

### `src/lib/presets.test.ts`
- Dois testes novos em `describe('editPreset')`:
  - troca nome e settings e mantém caderninho e evolução, sem alterar a outra configuração nem a lista original;
  - só registra a edição quando as settings mudam, e acumula várias edições.

## Verificação
- `npm run build` (`tsc --noEmit` + `vite build`): passou.
- `npm test`: os 29 testes passam, incluindo os 2 novos.
- O comando ainda termina com erro, mas por um motivo que já existia: `src/lib/parity.test.ts` importa `js/questions.js`, e esse arquivo não existe no repositório. Ele não foi alterado.
- O fluxo não foi testado manualmente no navegador.
