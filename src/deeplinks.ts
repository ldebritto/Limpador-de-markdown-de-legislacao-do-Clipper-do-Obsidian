import { gerarIdUnico } from './utils';

/**
 * Padrão para detectar IDs existentes no formato ^abc123
 * 6 caracteres alfanuméricos (lowercase) após o circunflexo
 */
const REGEX_ID_EXISTENTE = /\s*\^([a-z0-9]{6})$/;

/**
 * Coleta todos os IDs existentes no documento e os registra no Set
 * Isso garante que IDs já presentes não sejam reutilizados
 */
function coletarIdsExistentes(conteudo: string, idsUtilizados: Set<string>): void {
	const linhas = conteudo.split('\n');
	for (const linha of linhas) {
		const match = linha.match(REGEX_ID_EXISTENTE);
		if (match) {
			idsUtilizados.add(match[1]);
		}
	}
}

/**
 * Adiciona ID à linha se ela ainda não tiver um
 * Se já tiver, preserva o ID existente
 */
function adicionarIdSeNecessario(linha: string, idsUtilizados: Set<string>): string {
	// Verifica se a linha já tem um ID
	if (REGEX_ID_EXISTENTE.test(linha)) {
		return linha; // Preserva o ID existente
	}

	// Adiciona novo ID
	return `${linha} ^${gerarIdUnico(idsUtilizados)}`;
}

/**
 * Adiciona IDs únicos (^id) ao final de elementos legais para permitir deeplinks no Obsidian
 *
 * Elementos processados:
 * - Artigos: Art. 1º, Art. 2º, etc.
 * - Parágrafos: § 1º, § 2º, Parágrafo único
 * - Incisos: I -, II -, III -, etc. (numeração romana)
 * - Alíneas: a), b), c), etc.
 *
 * Ignora:
 * - Linhas tachadas (começam com ~~)
 * - Elementos que já têm ID
 */
export function adicionarDeeplinks(conteudo: string, idsUtilizados: Set<string>): string {
	// Primeiro, coleta todos os IDs que já existem no documento
	coletarIdsExistentes(conteudo, idsUtilizados);

	let resultado = conteudo;

	// Artigos: Art. 1º, Art. 2º, etc. (mas não tachados)
	resultado = resultado.replace(
		/^(?!~~)(Art\.\s*\d+[º°]?.*)$/gm,
		(match) => adicionarIdSeNecessario(match, idsUtilizados)
	);

	// Parágrafos: § 1º, § 2º, Parágrafo único (mas não tachados)
	resultado = resultado.replace(
		/^(?!~~)((?:§\s*\d+[º°]?|Parágrafo único).*)$/gm,
		(match) => adicionarIdSeNecessario(match, idsUtilizados)
	);

	// Incisos: I -, II -, III -, etc. (mas não tachados)
	resultado = resultado.replace(
		/^(?!~~)([IVXLCDM]+\s*[-–—].*)$/gm,
		(match) => adicionarIdSeNecessario(match, idsUtilizados)
	);

	// Alíneas: a), b), c), etc. (mas não tachados)
	resultado = resultado.replace(
		/^(?!~~)([a-z]\)\s*.*)$/gm,
		(match) => adicionarIdSeNecessario(match, idsUtilizados)
	);

	return resultado;
}
