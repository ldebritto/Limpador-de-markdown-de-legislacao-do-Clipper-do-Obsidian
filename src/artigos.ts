/**
 * Normaliza a formatação dos artigos no documento
 *
 * - Remove tabulações/espaços iniciais dos artigos
 * - Padroniza apenas o identificador em negrito (**Art. Xº**)
 * - O texto do artigo NÃO fica em negrito
 */

/**
 * Regex para detectar artigos (com ou sem negrito, com ou sem espaços iniciais)
 * Captura:
 * - Grupo 1: espaços iniciais (tabs, espaços)
 * - Grupo 2: negrito de abertura (opcional)
 * - Grupo 3: identificador do artigo (Art. Xº, Art. X-A, etc.)
 * - Grupo 4: negrito de fechamento (opcional)
 * - Grupo 5: resto da linha (texto do artigo)
 */
const ARTIGO_REGEX = /^(\s*)(\*\*)?(Art\.\s*\d+[º°]?(?:-[A-Z])?)(\*\*)?\s*(.*)$/gm;

/**
 * Normaliza a formatação dos artigos:
 * 1. Remove espaços/tabulações iniciais
 * 2. Coloca apenas o identificador em negrito (**Art. Xº**)
 * 3. Preserva o texto do artigo sem negrito
 */
export function normalizarArtigos(conteudo: string): string {
	return conteudo.replace(ARTIGO_REGEX, (_match, _espacos, _negritoAbre, identificador, _negritoFecha, texto) => {
		const idLimpo = identificador.trim();
		const textoLimpo = texto.trim();

		if (textoLimpo) {
			return `**${idLimpo}** ${textoLimpo}`;
		}
		return `**${idLimpo}**`;
	});
}
