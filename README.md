# Legislação Limpa - Plugin Obsidian

Plugin para limpar e estruturar documentos de legislação brasileira clipados pelo Web Clipper do Obsidian a partir do site do Planalto.


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

### 6. Atualização de Legislação

Permite atualizar uma legislação já processada com uma nova versão clipada do Planalto, preservando todos os links existentes:

**Workflow:**
1. Clipe a versão atualizada da lei usando o Obsidian Clipper
2. Abra o arquivo clipado no Obsidian
3. Execute: `Ctrl/Cmd + P` → "Atualizar legislação com nova versão"
4. Selecione o arquivo existente para atualizar

**O que acontece:**
- **Backup automático**: Cria cópia do arquivo existente com timestamp (ex: `LC 227 - backup 2026-01-28 143022.md`)
- **Reutiliza IDs**: Dispositivos existentes mantêm seus IDs de deeplink (preserva links de outras notas)
- **Gera novos IDs**: Dispositivos novos recebem IDs únicos
- **Preserva redações antigas**: Versões originais ficam em callouts `> [!note]- Redação original`
- **Mantém aliases manuais**: Aliases personalizados do arquivo antigo são preservados

**Exemplo de resultado:**
```markdown
> [!note]- Redação original
> **Art. 5º** O IBS incidirá sobre... ^abc123

**Art. 5º** O IBS incidirá sobre operações com bens e serviços... [(Redação dada pela LC 228/2026)] ^abc123
```

Os links existentes `[[LC 227#^abc123]]` continuam funcionando e apontam para a nova redação.

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

#### Processar nova legislação:
1. Abra um documento de legislação clipado
2. Execute: `Ctrl/Cmd + P` → "Processar documento de legislação"

#### Atualizar legislação existente:
1. Clipe a nova versão da lei usando Obsidian Clipper
2. Abra o arquivo clipado
3. Execute: `Ctrl/Cmd + P` → "Atualizar legislação com nova versão"
4. Selecione o arquivo existente para atualizar
5. O plugin criará um backup e atualizará o arquivo original

## Arquitetura

```
├── manifest.json          # Metadados do plugin Obsidian
├── package.json           # Dependências e scripts
├── tsconfig.json          # Configuração TypeScript
├── esbuild.config.mjs     # Build do plugin
├── main.js                # Plugin compilado (gerado pelo build)
└── src/
    ├── main.ts            # Entry point do plugin
    ├── processador.ts     # Classe orquestradora (processamento inicial)
    ├── atualizador.ts     # Atualização de legislação existente
    ├── types.ts           # Interfaces TypeScript
    ├── utils.ts           # Funções utilitárias (geração de IDs)
    ├── frontmatter.ts     # Parser de frontmatter e aliases
    ├── brasao.ts          # Remoção do brasão
    ├── tabelas.ts         # Proteção de tabelas
    ├── hierarquia.ts      # Conversão de hierarquia em headings
    ├── deeplinks.ts       # Geração de IDs para deeplinks
    ├── artigos.ts         # Normalização de artigos
    ├── normalizacao.ts    # Correção de problemas de formatação
    ├── duplicatas.ts      # Processamento de redações duplicadas
    └── extrator-ids.ts    # Extração de IDs de documentos existentes
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
