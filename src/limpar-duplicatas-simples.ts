/**
 * Versão simples da limpeza de IDs duplicados para uso no pipeline padrão
 *
 * Diferente de limpar-duplicatas.ts, esta versão:
 * - NÃO busca referências no vault (mais rápido)
 * - Sempre mantém o PRIMEIRO ID quando há duplicatas
 * - Usada automaticamente durante o processamento normal
 */

const REGEX_ID = /\^([a-z0-9]{6})/g;

/**
 * Remove IDs duplicados de uma linha, mantendo apenas o primeiro
 */
function removerIdsDuplicadosDaLinha(linha: string): string {
	const matches = Array.from(linha.matchAll(REGEX_ID));

	// Se tem 0 ou 1 ID, não há duplicatas
	if (matches.length <= 1) {
		return linha;
	}

	// Tem duplicatas - manter apenas o primeiro ID
	const primeiroId = matches[0][1];

	// Remove todos os IDs
	let resultado = linha.replace(REGEX_ID, '').trim();

	// Adiciona de volta apenas o primeiro
	resultado = `${resultado} ^${primeiroId}`;

	return resultado;
}

/**
 * Limpa IDs duplicados no documento inteiro
 * Mantém sempre o primeiro ID quando há múltiplos na mesma linha
 *
 * Ignora linhas tachadas (começam com ~~)
 *
 * @param conteudo Conteúdo do documento
 * @returns Conteúdo limpo e número de linhas corrigidas
 */
export function limparDuplicatasSimples(conteudo: string): {
	conteudo: string;
	linhasCorrigidas: number;
} {
	const linhas = conteudo.split('\n');
	let linhasCorrigidas = 0;

	const resultado = linhas.map(linha => {
		// Ignora linhas tachadas
		if (linha.trimStart().startsWith('~~')) {
			return linha;
		}

		const linhaLimpa = removerIdsDuplicadosDaLinha(linha);
		if (linhaLimpa !== linha) {
			linhasCorrigidas++;
		}
		return linhaLimpa;
	});

	return {
		conteudo: resultado.join('\n'),
		linhasCorrigidas
	};
}
