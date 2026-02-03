import { TFile, Vault } from 'obsidian';

/**
 * Padrão para detectar IDs no formato ^abc123
 */
const REGEX_ID = /\^([a-z0-9]{6})/g;

/**
 * Coleta todos os IDs únicos presentes no conteúdo
 */
function coletarTodosIds(conteudo: string): string[] {
	const ids = new Set<string>();
	const linhas = conteudo.split('\n');

	for (const linha of linhas) {
		// Ignora linhas tachadas
		if (linha.trimStart().startsWith('~~')) continue;

		for (const match of linha.matchAll(REGEX_ID)) {
			ids.add(match[1]);
		}
	}

	return Array.from(ids);
}

/**
 * Busca quais IDs têm referências em outros arquivos do vault
 * Lê cada arquivo uma só vez, usando um único regex para todos os IDs
 */
async function buscarIdsReferenciados(
	vault: Vault,
	nomeArquivoAtual: string,
	ids: string[]
): Promise<Set<string>> {
	const idsReferenciados = new Set<string>();

	if (ids.length === 0) return idsReferenciados;

	const arquivos = vault.getMarkdownFiles();

	// Regex único com alternation para todos os IDs
	// Suporta: [[doc#^id]], [[#^id]], [[doc#^id|alias]]
	const idsPattern = ids.map(id => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
	const padrao = new RegExp(`\\[\\[(?:[^\\]]+)?#\\^(${idsPattern})(?:\\|[^\\]]*)?\\]\\]`, 'g');

	const baseName = nomeArquivoAtual.replace('.md', '');

	for (const arquivo of arquivos) {
		if (arquivo.basename === baseName) continue;

		try {
			const conteudo = await vault.cachedRead(arquivo);
			for (const match of conteudo.matchAll(padrao)) {
				idsReferenciados.add(match[1]);
			}
		} catch (erro) {
			console.error(`Erro ao ler arquivo ${arquivo.path}:`, erro);
		}

		// Se já encontrou todos, pode parar
		if (idsReferenciados.size === ids.length) break;
	}

	return idsReferenciados;
}

/**
 * Remove IDs não referenciados de uma linha
 * Se a linha tem múltiplos IDs, mantém apenas os referenciados
 * Se nenhum é referenciado, remove todos
 */
function limparIdsNaLinha(linha: string, idsReferenciados: Set<string>): string {
	const matches = Array.from(linha.matchAll(REGEX_ID));
	if (matches.length === 0) return linha;

	// Encontra quais IDs desta linha são referenciados
	const idsParaManter = matches
		.map(m => m[1])
		.filter(id => idsReferenciados.has(id));

	// Remove todos os IDs da linha
	let resultado = linha.replace(REGEX_ID, '').trim();

	// Adiciona de volta apenas os referenciados
	for (const id of idsParaManter) {
		resultado = `${resultado} ^${id}`;
	}

	return resultado;
}

/**
 * Remove IDs não referenciados de um documento
 *
 * Para cada ID presente no documento:
 * 1. Verifica se há referências em outros arquivos do vault
 * 2. Mantém apenas IDs que têm referências
 * 3. Remove todos os outros
 *
 * @param vault Instância do Vault do Obsidian
 * @param arquivo Arquivo sendo processado
 * @param conteudo Conteúdo do arquivo
 * @returns Objeto com conteúdo limpo e relatório de alterações
 */
export async function removerIdsNaoReferenciados(
	vault: Vault,
	arquivo: TFile,
	conteudo: string
): Promise<{ conteudo: string; relatorio: string[] }> {
	const todosIds = coletarTodosIds(conteudo);

	if (todosIds.length === 0) {
		return { conteudo, relatorio: [] };
	}

	const idsReferenciados = await buscarIdsReferenciados(
		vault, arquivo.name, todosIds
	);

	const idsParaRemover = todosIds.filter(id => !idsReferenciados.has(id));

	if (idsParaRemover.length === 0) {
		return { conteudo, relatorio: [] };
	}

	// Processar linha por linha
	const linhas = conteudo.split('\n');
	const resultado = linhas.map(linha => {
		if (linha.trimStart().startsWith('~~')) return linha;
		return limparIdsNaLinha(linha, idsReferenciados);
	});

	const relatorio: string[] = [];
	relatorio.push(`IDs no documento: ${todosIds.length}`);
	relatorio.push(`IDs com referências (preservados): ${idsReferenciados.size}`);
	if (idsReferenciados.size > 0) {
		relatorio.push(`  ${Array.from(idsReferenciados).map(id => `^${id}`).join(', ')}`);
	}
	relatorio.push(`IDs sem referências (removidos): ${idsParaRemover.length}`);

	return {
		conteudo: resultado.join('\n'),
		relatorio
	};
}
