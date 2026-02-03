# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Este é um plugin Obsidian para limpar documentos de legislação brasileira clipados. O plugin processa markdown para adicionar aliases automáticos, remover brasão, converter hierarquia em headings, adicionar deeplinks e proteger tabelas durante o processamento.

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
7. Adicionar deeplinks
8. Restaurar tabelas
9. **Limpar duplicatas** (remove IDs duplicados mantendo primeiro)

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

### Deeplinks
- IDs de 6 caracteres alfanuméricos (lowercase)
- Aplicados a: Art., §, Parágrafo único, incisos (I, II...), alíneas (a, b...)
- Formato: `^abc123` no final da linha
- Usa `idsUtilizados` Set para garantir unicidade entre tabelas e deeplinks
- **Preserva IDs existentes**: Se um elemento já tiver um ID, ele não é duplicado
- **Ignora linhas tachadas**: Linhas que começam com `~~` (redações revogadas) não recebem IDs
- Primeiro coleta todos os IDs existentes, depois adiciona novos apenas onde necessário

### Limpeza de Duplicatas
- **Automática no pipeline**: Remove IDs duplicados mantendo sempre o primeiro
- **Versão simples** (`limpar-duplicatas-simples.ts`): Usada no processamento normal, rápida
- **Versão inteligente** (`limpar-duplicatas.ts`): Comando separado, busca referências no vault
- Executada DEPOIS de restaurar tabelas (para processar todo o documento final)

## Arquitetura

### Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `src/main.ts` | Entry point do plugin Obsidian - registra comandos |
| `src/processador.ts` | Orquestra todas as etapas |
| `src/frontmatter.ts` | Gera aliases automáticos |
| `src/brasao.ts` | Remove brasão da República |
| `src/tabelas.ts` | Protege/restaura tabelas |
| `src/converter-negrito.ts` | Remove negrito de divisões hierárquicas |
| `src/remover-indentacao.ts` | Remove indentação indesejada de elementos legais |
| `src/hierarquia.ts` | Converte divisões em headings |
| `src/deeplinks.ts` | Adiciona IDs para links de bloco |
| `src/limpar-duplicatas-simples.ts` | Remove IDs duplicados (versão rápida) |
| `src/limpar-duplicatas.ts` | Remove IDs duplicados (versão inteligente com busca) |
| `src/utils.ts` | Funções utilitárias (geração de IDs) |
| `src/types.ts` | Interfaces TypeScript |

### Pipeline de Processamento

A classe `ProcessadorLegislacao` mantém dois estados:
- `tabelasProtegidas: TabelasProtegidas` - Mapa de placeholder → conteúdo original da tabela
- `idsUtilizados: Set<string>` - IDs usados (compartilhado entre proteção de tabelas e deeplinks)

```typescript
processar(conteudo: string): string {
    1. removerBrasaoDoc()           // Remove tabela do cabeçalho
    2. protegerTabelasDoc()         // Armazena tabelas, insere placeholders
    3. processarFrontmatterDoc()    // Gera aliases
    4. converterNegritoDoc()        // **TÍTULO I** → TÍTULO I
    5. removerIndentacaoDoc()       // Remove espaços indesejados
    6. converterHierarquiaDoc()     // LIVRO → #, TÍTULO → ##, etc.
    7. adicionarIdsDoc()            // Adiciona IDs ^abc123
    8. restaurarTabelasDoc()        // Substitui placeholders por tabelas
    9. limparDuplicatasSimplesDoc() // Remove IDs duplicados (mantém primeiro)
}
```

## Comandos do Plugin

O plugin oferece dois comandos no Obsidian:

1. **"Processar documento de legislação"** - Comando principal
   - Aplica todas as transformações (aliases, remoção de brasão, hierarquia, deeplinks, etc.)
   - **Automaticamente remove IDs duplicados** mantendo o primeiro
   - Use este comando para documentos novos E reprocessamento de documentos antigos

2. **"Limpar IDs duplicados (buscar referências)"** - Comando avançado/opcional
   - Apenas para casos especiais onde você tem links existentes `[[doc#^id]]`
   - Detecta linhas como: `Art. 1º texto ^abc123 ^def456`
   - Busca referências no vault inteiro para cada ID
   - Mantém o ID que tem links em outros arquivos
   - Gera relatório detalhado no console
   - **Raramente necessário** - o comando principal já remove duplicatas

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
