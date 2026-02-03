# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Este é um plugin Obsidian para limpar documentos de legislação brasileira clipados. O plugin processa markdown para adicionar aliases automáticos, remover brasão, converter hierarquia em headings, remover IDs não referenciados e proteger tabelas durante o processamento.

## Decisões de Projeto (NÃO ALTERAR)

### TypeScript/Build
- `importHelpers: false` no tsconfig.json (evita dependência de tslib)
- Target ES6 para compatibilidade com Obsidian Mobile (iPad)
- Sem dependências externas de runtime

### Ordem de Processamento
A ordem em `processador.ts` é intencional:
1. Remover brasão **ANTES** de proteger tabelas
2. Proteger tabelas (placeholder)
3. Processar frontmatter
4. **Converter negrito** (remove `**TÍTULO I**` → `TÍTULO I`)
5. **Remover indentação** (remove espaços indesejados)
6. Converter hierarquia (transforma em headings)
7. Restaurar tabelas
8. **Agrupar redações revogadas** (callouts retraídos)

Após o pipeline síncrono, `main.ts` executa a limpeza vault-aware de IDs não referenciados.

### Redações Revogadas
- Linhas tachadas (`~~texto~~`) são agrupadas em callouts retraídos: `> [!Quote]- Redação revogada`
- Linhas tachadas consecutivas (separadas apenas por linhas vazias) formam um único callout
- Indentação pré-existente é removida ao entrar no callout
- Linhas parcialmente tachadas (e.g. `a) ~~texto~~`) NÃO são afetadas
- Linhas dentro de citação (`> ~~texto~~`) NÃO são afetadas
- Deve ocorrer DEPOIS de restaurar tabelas

### IDs / Deeplinks
- **Não são adicionados automaticamente** — o plugin não gera IDs novos
- IDs existentes no formato `^abc123` (6 chars alfanuméricos lowercase) são preservados **apenas se referenciados** em outros arquivos do vault (`[[doc#^id]]` ou `[[doc#^id|alias]]`)
- IDs sem nenhuma referência são removidos durante o processamento
- Linhas tachadas (`~~`) são ignoradas na limpeza
- A busca de referências lê cada arquivo do vault uma só vez, usando um regex com alternation para performance O(vault_files)
- A limpeza ocorre **depois** de restaurar tabelas (para processar o documento completo)

### Proteção de Tabelas
- Usa placeholders temporários `<!--PROTECTED_TABLE_uuid-->`
- Protege tanto tabelas HTML (`<table>`) quanto Markdown (`|...|`)
- Tabelas são restauradas no final do processamento

### Conversão de Negrito
- Remove negrito de divisões hierárquicas (`**TÍTULO I**` → `TÍTULO I`)
- Problema: Constituição e outros documentos vêm com hierarquia em negrito
- Remove também o negrito dos nomes das divisões
- Deve ocorrer ANTES de remover indentação e converter hierarquia
- Permite que converterHierarquia processe corretamente

### Remoção de Indentação
- Remove espaços no início de elementos legais (Art., §, incisos, alíneas)
- Problema: Web Clipper preserva formatação HTML com espaços indesejados
- Preserva citações (`>`) e blocos de código (4+ espaços)
- Deve ocorrer DEPOIS de converter negrito e ANTES de converter hierarquia

### Hierarquia
- Divisões dentro de citação (`>`) são IGNORADAS (são referências a outras leis)
- Formato: `# LIVRO I - NOME` (identificador + hífen + nome na mesma linha)
- **Suporta numeração com hífen**: Seção V-A, Capítulo I-B, etc.
- Pula linhas de link (ex: `[(Incluído pela EC...)]`) ao buscar o nome da divisão
- A próxima linha não-vazia e não-especial após um identificador é tratada como seu nome
- Mapeamento de níveis:
  - LIVRO, ANEXO → `#` (h1)
  - TÍTULO → `##` (h2)
  - CAPÍTULO → `###` (h3)
  - Seção → `####` (h4)
  - Subseção → `#####` (h5)

## Arquitetura

### Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `src/main.ts` | Entry point do plugin Obsidian - registra comando e orquestra limpeza de IDs |
| `src/processador.ts` | Orquestra as etapas síncronas do pipeline |
| `src/frontmatter.ts` | Gera aliases automáticos |
| `src/brasao.ts` | Remove brasão da República |
| `src/tabelas.ts` | Protege/restaura tabelas |
| `src/converter-negrito.ts` | Remove negrito de divisões hierárquicas |
| `src/remover-indentacao.ts` | Remove indentação indesejada de elementos legais |
| `src/hierarquia.ts` | Converte divisões em headings |
| `src/agrupar-revogadas.ts` | Agrupa redações revogadas em callouts retraídos |
| `src/limpar-duplicatas.ts` | Remove IDs não referenciados (busca no vault) |
| `src/utils.ts` | Funções utilitárias (geração de IDs para placeholders) |
| `src/types.ts` | Interfaces TypeScript |

### Pipeline de Processamento

A classe `ProcessadorLegislacao` mantém dois estados:
- `tabelasProtegidas: TabelasProtegidas` - Mapa de placeholder → conteúdo original da tabela
- `idsUtilizados: Set<string>` - IDs usados para placeholders de tabelas

```typescript
// Pipeline síncrono (processador.ts)
processar(conteudo: string): string {
    1. removerBrasaoDoc()           // Remove tabela do cabeçalho
    2. protegerTabelasDoc()         // Armazena tabelas, insere placeholders
    3. processarFrontmatterDoc()    // Gera aliases
    4. converterNegritoDoc()        // **TÍTULO I** → TÍTULO I
    5. removerIndentacaoDoc()       // Remove espaços indesejados
    6. converterHierarquiaDoc()     // LIVRO → #, TÍTULO → ##, etc.
    7. restaurarTabelasDoc()        // Substitui placeholders por tabelas
    8. agruparRevogadasDoc()        // ~~revogado~~ → callout retraído
}

// Pós-processamento assíncrono (main.ts)
removerIdsNaoReferenciados()       // Remove IDs sem referências no vault
```

## Comando do Plugin

O plugin oferece um comando no Obsidian:

**"Processar documento de legislação"** - Comando principal
- Aplica todas as transformações (aliases, remoção de brasão, hierarquia, etc.)
- Remove IDs (`^abc123`) que não têm referências em outros arquivos do vault
- Preserva IDs que são referenciados (`[[doc#^id]]` ou `[[doc#^id|alias]]`)
- Loga relatório de IDs removidos/preservados no console

## Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Build de produção (com minificação)
npm run build

# Build de desenvolvimento (com sourcemaps)
npm run dev

# Testar com arquivo de exemplo
npx tsx test-exemplo.ts
# Processa Exemplo.md → Exemplo_processado.md
# Mostra primeiras 50 linhas no console
```

## Compatibilidade

- `isDesktopOnly: false` no manifest.json - funciona no iPad
- Testado com documentos do planalto.gov.br
- Target ES6 no tsconfig, ES2018 no esbuild
- APIs do Obsidian e CodeMirror marcadas como external no build
- Sem APIs do Node.js no código de runtime (apenas em scripts de build/teste)
