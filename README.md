# Legislação Limpa - Plugin Obsidian

Plugin para limpar e estruturar documentos de legislação brasileira clipados pelo Web Clipper do Obsidian.


## Funcionalidades

### 1. Aliases Automáticos

Para "LEI COMPLEMENTAR Nº 227, DE 13 DE JANEIRO DE 2026", gera:
- `Lei Complementar nº 227/2026`
- `LC nº 227/2026`
- `Lei Complementar 227/2026`
- `LC 227/2026`

**Tipos normativos suportados:** Lei, Lei Complementar, Decreto, Decreto-Lei, Medida Provisória, Emenda Constitucional, Resolução, Portaria, Instrução Normativa.

### 2. Remoção do Brasão

Remove automaticamente a tabela com o brasão da República no cabeçalho.

### 3. Hierarquia em Headings

| Divisão    | Nível   | Exemplo |
|------------|---------|---------|
| LIVRO      | `#`     | `# LIVRO I - DA ADMINISTRAÇÃO...` |
| ANEXO      | `#`     | `# ANEXO I - ...` |
| TÍTULO     | `##`    | `## TÍTULO I - DO COMITÊ GESTOR...` |
| CAPÍTULO   | `###`   | `### CAPÍTULO I - DISPOSIÇÕES GERAIS` |
| Seção      | `####`  | `#### Seção I - Das Competências...` |
| Subseção   | `#####` | `##### Subseção I - ...` |

**Nota:** Divisões dentro de blocos de citação (`>`) são ignoradas (referências a outras leis).

### 4. Deeplinks (IDs Únicos)

Cada elemento recebe um ID para referência via link de bloco:

```markdown
Art. 1º É instituído o Comitê Gestor... ^0hnpoz
Parágrafo único. O CGIBS, nos termos... ^d4glvc
I - definirá as diretrizes... ^qm2vd5
a) nas hipóteses previstas... ^x7y8z9
```

**Uso no Obsidian:** `[[Lcp 227#^0hnpoz]]`

### 5. Proteção de Tabelas

Tabelas HTML e Markdown são preservadas intactas durante o processamento.

## Status do Projeto

Esse projeto foi implementado usando Claude Code e se destina a uso pessoal. O código foi aberto para que todos usar, se a funcionalidade atual lhe bastar. A princípio, não pretendo implementar novas funcionalidades.

## Como Usar

### Instalação

1. Execute `npm install` e `npm run build` na pasta do projeto
2. Copie os arquivos `main.js` e `manifest.json` para:
   ```
   <seu-vault>/.obsidian/plugins/legislacao-limpa/
   ```
3. No Obsidian, vá em Configurações → Plugins da comunidade → Ative "Legislação Limpa"

### Uso

1. Abra um documento de legislação clipado
2. Execute o comando: `Ctrl/Cmd + P` → "Processar documento de legislação"

## Arquitetura

```
├── manifest.json          # Metadados do plugin Obsidian
├── package.json           # Dependências e scripts
├── tsconfig.json          # Configuração TypeScript
├── esbuild.config.mjs     # Build do plugin
├── main.js                # Plugin compilado (gerado pelo build)
└── src/
    ├── main.ts            # Entry point do plugin
    ├── processador.ts     # Classe orquestradora
    ├── types.ts           # Interfaces TypeScript
    ├── utils.ts           # Funções utilitárias (geração de IDs)
    ├── frontmatter.ts     # Parser de frontmatter e aliases
    ├── brasao.ts          # Remoção do brasão
    ├── tabelas.ts         # Proteção de tabelas
    ├── hierarquia.ts      # Conversão de hierarquia em headings
    └── deeplinks.ts       # Geração de IDs para deeplinks
```

## Ordem de Processamento

```typescript
// Em processador.ts
processar(conteudo: string): string {
    // 1. Remover brasão (antes de proteger tabelas)
    resultado = this.removerBrasaoDoc(resultado);

    // 2. Proteger tabelas (placeholder temporário)
    resultado = this.protegerTabelasDoc(resultado);

    // 3. Processar frontmatter e aliases
    resultado = this.processarFrontmatterDoc(resultado);

    // 4. Converter hierarquia em headings
    resultado = this.converterHierarquiaDoc(resultado);

    // 5. Adicionar IDs únicos (deeplinks)
    resultado = this.adicionarIdsDoc(resultado);

    // 6. Restaurar tabelas
    resultado = this.restaurarTabelasDoc(resultado);
}
```

## Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Build de produção
npm run build

# Testar com arquivo de exemplo
npx tsx test-exemplo.ts

# Verificar resultado
# Abre Exemplo_processado.md
```

---

## Notas Técnicas

- JavaScript/TypeScript puro, sem dependências de runtime
- Compatível com Obsidian Desktop e Mobile (iPad)
- `isDesktopOnly: false` no manifest.json
- Target ES6 (compatibilidade ampla)
