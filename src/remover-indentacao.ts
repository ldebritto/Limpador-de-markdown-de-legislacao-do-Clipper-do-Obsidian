/**
 * Remove indentação indesejada de elementos legais
 *
 * Problema: O Web Clipper às vezes preserva espaços do HTML original,
 * criando linhas como:
 *        Art. 217. Texto...
 *        § 1º Texto...
 *        I - Texto...
 *
 * Solução: Remove espaços no início de linhas que contêm elementos legais
 * (Art., §, Parágrafo único, incisos, alíneas)
 */

/**
 * Padrões que identificam elementos legais que NÃO devem ter indentação
 */
const ELEMENTOS_LEGAIS = [
	/^Art\.\s/i,                    // Art. 1º, Art. 2º, etc.
	/^§\s*\d+/i,                    // § 1º, § 2º, etc.
	/^Parágrafo único/i,            // Parágrafo único
	/^[IVXLCDM]+\s*[-–—]/,          // I -, II -, III -, etc.
	/^[a-z]\)\s/,                   // a), b), c), etc.
];

/**
 * Verifica se uma linha contém um elemento legal
 */
function ehElementoLegal(linha: string): boolean {
	const linhaTrimmed = linha.trimStart();
	return ELEMENTOS_LEGAIS.some(pattern => pattern.test(linhaTrimmed));
}

/**
 * Remove indentação indesejada de elementos legais
 *
 * Preserva:
 * - Linhas que começam com > (citações)
 * - Linhas de código (começam com 4+ espaços ou tab)
 * - Linhas vazias
 *
 * Remove indentação de:
 * - Artigos: Art. 1º, Art. 2º, etc.
 * - Parágrafos: § 1º, § 2º, Parágrafo único
 * - Incisos: I -, II -, III -, etc.
 * - Alíneas: a), b), c), etc.
 */
export function removerIndentacao(conteudo: string): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];

	for (const linha of linhas) {
		// Preserva linhas vazias
		if (linha.trim() === '') {
			resultado.push(linha);
			continue;
		}

		// Preserva citações (começam com >)
		if (linha.trimStart().startsWith('>')) {
			resultado.push(linha);
			continue;
		}

		// Preserva linhas tachadas (começam com ~~)
		if (linha.trimStart().startsWith('~~')) {
			resultado.push(linha);
			continue;
		}

		// Preserva blocos de código (4+ espaços no início)
		// Mas só se a linha NÃO for um elemento legal
		const espacosIniciais = linha.match(/^(\s*)/)?.[1] || '';
		if (espacosIniciais.length >= 4 && !ehElementoLegal(linha)) {
			resultado.push(linha);
			continue;
		}

		// Se é um elemento legal, remove toda a indentação
		if (ehElementoLegal(linha)) {
			resultado.push(linha.trimStart());
		} else {
			// Preserva outras linhas como estão
			resultado.push(linha);
		}
	}

	return resultado.join('\n');
}
