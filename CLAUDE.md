# Instruções para o Claude

Este é um plugin Obsidian para limpar documentos de legislação brasileira clipados.

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
4. Converter hierarquia
5. Adicionar deeplinks
6. Restaurar tabelas

### Proteção de Tabelas
- Usa placeholders temporários `<!--PROTECTED_TABLE_uuid-->`
- Protege tanto tabelas HTML (`<table>`) quanto Markdown (`|...|`)
- Tabelas são restauradas no final do processamento

### Hierarquia
- Divisões dentro de citação (`>`) são IGNORADAS (são referências a outras leis)
- Formato: `# LIVRO I - NOME` (identificador + hífen + nome na mesma linha)

### Deeplinks
- IDs de 6 caracteres alfanuméricos
- Aplicados a: Art., §, Parágrafo único, incisos (I, II...), alíneas (a, b...)

## Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `src/processador.ts` | Orquestra todas as etapas |
| `src/frontmatter.ts` | Gera aliases automáticos |
| `src/brasao.ts` | Remove brasão da República |
| `src/tabelas.ts` | Protege/restaura tabelas |
| `src/hierarquia.ts` | Converte divisões em headings |
| `src/deeplinks.ts` | Adiciona IDs para links de bloco |

## Comandos

```bash
npm run build          # Compila o plugin
npx tsx test-exemplo.ts # Testa com Exemplo.md
```

## Compatibilidade

- `isDesktopOnly: false` - funciona no iPad
- Testado com documentos do planalto.gov.br
