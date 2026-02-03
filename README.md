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

O plugin converte automaticamente a hierarquia do documento em headings Markdown, **mesmo quando vem em negrito** do site original:

**Entrada (do Web Clipper):**
```markdown
**TÍTULO I**
**Dos Princípios Fundamentais**
```

**Saída (processada):**
```markdown
## TÍTULO I - Dos Princípios Fundamentais
```

| Divisão    | Nível   | Exemplo |
|------------|---------|---------|
| LIVRO      | `#`     | `# LIVRO I - DA ADMINISTRAÇÃO...` |
| ANEXO      | `#`     | `# ANEXO I - ...` |
| TÍTULO     | `##`    | `## TÍTULO I - DO COMITÊ GESTOR...` |
| CAPÍTULO   | `###`   | `### CAPÍTULO I - DISPOSIÇÕES GERAIS` |
| Seção      | `####`  | `#### Seção I - Das Competências...` |
| Subseção   | `#####` | `##### Subseção I - ...` |

**Recursos especiais:**
- ✅ Suporta numeração com hífen (ex: **Seção V-A** → `#### Seção V-A`)
- ✅ Pula linhas de referência a emendas ao buscar o nome da divisão
- ✅ Divisões dentro de blocos de citação (`>`) são ignoradas (referências a outras leis)

### 4. Deeplinks (IDs Únicos)

Cada elemento recebe um ID para referência via link de bloco:

```markdown
Art. 1º É instituído o Comitê Gestor... ^0hnpoz
Parágrafo único. O CGIBS, nos termos... ^d4glvc
I - definirá as diretrizes... ^qm2vd5
a) nas hipóteses previstas... ^x7y8z9
```

**Uso no Obsidian:** `[[Lcp 227#^0hnpoz]]`

**Regras:**
- ✅ IDs existentes são preservados ao reprocessar
- ✅ Linhas tachadas (`~~texto~~`) não recebem IDs
- ✅ Apenas elementos sem ID receberão novos IDs

### 5. Remoção de Indentação Indesejada

O Web Clipper às vezes preserva espaços do HTML original, criando linhas mal formatadas:

```markdown
       Art. 217. Texto do artigo...
       § 1º Texto do parágrafo...
```

O plugin remove automaticamente essa indentação de:
- Artigos (Art. 1º, Art. 2º, etc.)
- Parágrafos (§ 1º, Parágrafo único, etc.)
- Incisos (I -, II -, III -, etc.)
- Alíneas (a), b), c), etc.)

**Preserva:**
- Citações (linhas que começam com `>`)
- Blocos de código (4+ espaços)
- Outras formatações intencionais

### 6. Proteção de Tabelas

Tabelas HTML e Markdown são preservadas intactas durante o processamento.

### 7. Limpeza Automática de IDs Duplicados

Durante o processamento normal, o plugin **automaticamente detecta e remove IDs duplicados**, mantendo sempre o primeiro:

**Antes:**
```markdown
Art. 1º Texto do artigo. ^abc123 ^def456 ^ghi789
```

**Depois (automático):**
```markdown
Art. 1º Texto do artigo. ^abc123
```

### 8. Limpeza Inteligente de IDs (comando separado)

Comando opcional para casos especiais onde você quer manter o ID que tem referências:

**Exemplo de problema:**
```markdown
Art. 1º Texto do artigo. ^abc123 ^def456 ^ghi789
```

**Após limpeza:**
```markdown
Art. 1º Texto do artigo. ^abc123
```

**Como decide qual ID manter:**
1. Varre todo o vault buscando links `[[arquivo#^id]]` para cada ID duplicado
2. Mantém o ID que tem referências em outros arquivos
3. Se nenhum tiver referências, mantém o primeiro
4. Remove todos os outros IDs da linha

**Relatório:** O comando gera um relatório detalhado no console mostrando quantas referências cada ID tinha.

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

#### Processar documento
1. Abra um documento de legislação clipado
2. Execute o comando: `Ctrl/Cmd + P` → "Processar documento de legislação"
3. Pronto! O documento será:
   - Limpo (brasão removido, indentação corrigida)
   - Estruturado (hierarquia em headings)
   - Indexado (IDs únicos adicionados)
   - Corrigido (IDs duplicados removidos automaticamente)

#### Comando especial: Limpar IDs duplicados com busca de referências (opcional)

Use apenas se você já tem links `[[doc#^id]]` para IDs duplicados e quer preservar o ID correto:

1. Abra o documento
2. Execute: `Ctrl/Cmd + P` → "Limpar IDs duplicados (buscar referências)"
3. O plugin busca no vault inteiro e mantém o ID que tem links
4. Veja o console (`Ctrl/Cmd + Shift + I`) para o relatório detalhado

**Nota:** Na maioria dos casos, você não precisa deste comando - o processamento normal já remove duplicatas.

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
