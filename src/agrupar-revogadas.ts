/**
 * Agrupa linhas tachadas (redações revogadas) em callouts retraídos do Obsidian
 *
 * Linhas que começam com ~~ representam versões anteriores de dispositivos legais.
 * Em vez de ficarem soltas no documento, são agrupadas em:
 * > [!Quote]- Redação revogada
 * > ~~texto revogado~~
 *
 * Linhas consecutivas tachadas (separadas apenas por linhas em branco)
 * formam um único callout.
 */

/**
 * Verifica se a linha é tachada (começa com ~~)
 */
function ehLinhaTachada(linha: string): boolean {
	return linha.trimStart().startsWith('~~');
}

/**
 * Procura a próxima linha não-vazia a partir de um índice
 * Retorna a linha ou null se não encontrar
 */
function proximaLinhaNaoVazia(linhas: string[], a_partir_de: number): string | null {
	for (let i = a_partir_de; i < linhas.length; i++) {
		if (linhas[i].trim() !== '') {
			return linhas[i];
		}
	}
	return null;
}

/**
 * Agrupa redações revogadas (linhas tachadas) em callouts retraídos
 *
 * Regras:
 * - Detecta linhas cuja versão trimmed começa com ~~
 * - Linhas tachadas consecutivas (separadas apenas por linhas vazias) formam um callout
 * - Indentação é removida ao entrar no callout
 * - Linhas parcialmente tachadas (e.g. `a) ~~texto~~`) não são afetadas
 * - Linhas dentro de citação (`> ~~texto~~`) não são afetadas
 */
export function agruparRedacoesRevogadas(conteudo: string): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];
	let dentroDeGrupo = false;

	for (let i = 0; i < linhas.length; i++) {
		const linha = linhas[i];
		const tachada = ehLinhaTachada(linha);
		const vazia = linha.trim() === '';

		if (tachada) {
			if (!dentroDeGrupo) {
				resultado.push('> [!Quote]- Redação revogada');
				dentroDeGrupo = true;
			}
			resultado.push(`> ${linha.trimStart()}`);
		} else if (vazia && dentroDeGrupo) {
			// Linha vazia dentro de um grupo — verificar se o grupo continua
			const proxima = proximaLinhaNaoVazia(linhas, i + 1);
			if (proxima && ehLinhaTachada(proxima)) {
				resultado.push('>');
			} else {
				// Grupo terminou
				dentroDeGrupo = false;
				resultado.push('');
			}
		} else {
			dentroDeGrupo = false;
			resultado.push(linha);
		}
	}

	return resultado.join('\n');
}
