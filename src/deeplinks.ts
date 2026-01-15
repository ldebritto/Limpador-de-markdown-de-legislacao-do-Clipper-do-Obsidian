import { gerarIdUnico } from './utils';

/**
 * Adiciona IDs únicos (^id) ao final de elementos legais para permitir deeplinks no Obsidian
 *
 * Elementos processados:
 * - Artigos: Art. 1º, Art. 2º, etc.
 * - Parágrafos: § 1º, § 2º, Parágrafo único
 * - Incisos: I -, II -, III -, etc. (numeração romana)
 * - Alíneas: a), b), c), etc.
 */
export function adicionarDeeplinks(conteudo: string, idsUtilizados: Set<string>): string {
	let resultado = conteudo;

	// Artigos: Art. 1º, Art. 2º, etc.
	resultado = resultado.replace(
		/^(Art\.\s*\d+[º°]?.*)$/gm,
		(match) => `${match} ^${gerarIdUnico(idsUtilizados)}`
	);

	// Parágrafos: § 1º, § 2º, Parágrafo único
	resultado = resultado.replace(
		/^((?:§\s*\d+[º°]?|Parágrafo único).*)$/gm,
		(match) => `${match} ^${gerarIdUnico(idsUtilizados)}`
	);

	// Incisos: I -, II -, III -, etc. (romanos no início da linha)
	resultado = resultado.replace(
		/^([IVXLCDM]+\s*[-–—].*)$/gm,
		(match) => `${match} ^${gerarIdUnico(idsUtilizados)}`
	);

	// Alíneas: a), b), c), etc.
	resultado = resultado.replace(
		/^([a-z]\)\s*.*)$/gm,
		(match) => `${match} ^${gerarIdUnico(idsUtilizados)}`
	);

	return resultado;
}
