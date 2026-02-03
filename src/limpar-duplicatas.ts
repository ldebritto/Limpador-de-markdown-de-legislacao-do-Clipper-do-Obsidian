import { TFile, Vault } from 'obsidian';

/**
 * Padrão para detectar IDs no formato ^abc123
 */
const REGEX_ID = /\^([a-z0-9]{6})/g;

/**
 * Interface para representar um ID duplicado encontrado
 */
interface IdDuplicado {
	linha: string;
	numeroLinha: number;
	ids: string[];
}

/**
 * Encontra todas as linhas com IDs duplicados no conteúdo
 */
export function encontrarLinhasComIdsDuplicados(conteudo: string): IdDuplicado[] {
	const linhas = conteudo.split('\n');
	const duplicatas: IdDuplicado[] = [];

	linhas.forEach((linha, index) => {
		const matches = Array.from(linha.matchAll(REGEX_ID));

		if (matches.length > 1) {
			duplicatas.push({
				linha,
				numeroLinha: index + 1,
				ids: matches.map(m => m[1])
			});
		}
	});

	return duplicatas;
}

/**
 * Busca referências a um ID específico em todo o vault
 * Retorna o número de referências encontradas
 */
async function buscarReferenciasNoVault(
	vault: Vault,
	nomeArquivoAtual: string,
	id: string
): Promise<number> {
	const arquivos = vault.getMarkdownFiles();
	let totalReferencias = 0;

	// Padrão para encontrar links para o ID específico
	// Formato: [[arquivo#^id]] ou [[#^id]]
	const padraoLink = new RegExp(`\\[\\[(?:[^\\]]+)?#\\^${id}\\]\\]`, 'g');

	for (const arquivo of arquivos) {
		// Pula o arquivo atual (só queremos referências de outros arquivos)
		if (arquivo.basename === nomeArquivoAtual.replace('.md', '')) {
			continue;
		}

		try {
			const conteudo = await vault.cachedRead(arquivo);
			const matches = conteudo.matchAll(padraoLink);
			totalReferencias += Array.from(matches).length;
		} catch (erro) {
			console.error(`Erro ao ler arquivo ${arquivo.path}:`, erro);
		}
	}

	return totalReferencias;
}

/**
 * Decide qual ID manter baseado em referências no vault
 * Retorna o ID que deve ser mantido
 */
async function decidirIdParaManter(
	vault: Vault,
	nomeArquivo: string,
	ids: string[]
): Promise<string> {
	// Busca referências para cada ID
	const referencias: Map<string, number> = new Map();

	for (const id of ids) {
		const count = await buscarReferenciasNoVault(vault, nomeArquivo, id);
		referencias.set(id, count);
	}

	// Encontra o ID com mais referências
	let idComMaisReferencias = ids[0];
	let maxReferencias = referencias.get(ids[0]) || 0;

	for (const id of ids) {
		const count = referencias.get(id) || 0;
		if (count > maxReferencias) {
			maxReferencias = count;
			idComMaisReferencias = id;
		}
	}

	return idComMaisReferencias;
}

/**
 * Remove IDs duplicados de uma linha, mantendo apenas o ID especificado
 */
function removerIdsDuplicados(linha: string, idParaManter: string): string {
	// Encontra todos os IDs na linha
	const matches = Array.from(linha.matchAll(REGEX_ID));

	if (matches.length <= 1) {
		return linha; // Nada a fazer
	}

	// Remove todos os IDs
	let resultado = linha.replace(REGEX_ID, '').trim();

	// Adiciona de volta apenas o ID que deve ser mantido
	resultado = `${resultado} ^${idParaManter}`;

	return resultado;
}

/**
 * Limpa IDs duplicados em um documento
 *
 * Para cada linha com múltiplos IDs:
 * 1. Verifica se há referências no vault para algum desses IDs
 * 2. Mantém o ID que tem referências, ou o primeiro se nenhum tiver
 * 3. Remove os IDs duplicados
 *
 * @param vault Instância do Vault do Obsidian
 * @param arquivo Arquivo sendo processado
 * @param conteudo Conteúdo do arquivo
 * @returns Objeto com conteúdo limpo e relatório de alterações
 */
export async function limparIdsDuplicados(
	vault: Vault,
	arquivo: TFile,
	conteudo: string
): Promise<{ conteudo: string; relatorio: string[] }> {
	const duplicatas = encontrarLinhasComIdsDuplicados(conteudo);

	if (duplicatas.length === 0) {
		return {
			conteudo,
			relatorio: ['Nenhum ID duplicado encontrado.']
		};
	}

	const linhas = conteudo.split('\n');
	const relatorio: string[] = [];

	relatorio.push(`Encontradas ${duplicatas.length} linha(s) com IDs duplicados:\n`);

	for (const dup of duplicatas) {
		// Decide qual ID manter
		const idParaManter = await decidirIdParaManter(vault, arquivo.name, dup.ids);

		// Verifica quantas referências cada ID tem
		const refsPromises = dup.ids.map(async id => {
			const count = await buscarReferenciasNoVault(vault, arquivo.name, id);
			return { id, count };
		});
		const refs = await Promise.all(refsPromises);

		// Remove IDs duplicados da linha
		linhas[dup.numeroLinha - 1] = removerIdsDuplicados(
			dup.linha,
			idParaManter
		);

		// Adiciona ao relatório
		relatorio.push(`Linha ${dup.numeroLinha}:`);
		relatorio.push(`  IDs encontrados: ${dup.ids.map(id => `^${id}`).join(', ')}`);
		refs.forEach(r => {
			relatorio.push(`    ^${r.id}: ${r.count} referência(s)`);
		});
		relatorio.push(`  ✓ Mantido: ^${idParaManter}`);
		relatorio.push(`  ✗ Removidos: ${dup.ids.filter(id => id !== idParaManter).map(id => `^${id}`).join(', ')}`);
		relatorio.push('');
	}

	return {
		conteudo: linhas.join('\n'),
		relatorio
	};
}
