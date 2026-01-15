import { TabelasProtegidas } from './types';
import { gerarIdUnico } from './utils';

/**
 * Protege tabelas do documento substituindo por placeholders
 * Retorna o conteúdo com placeholders e um mapa para restauração
 */
export function protegerTabelas(
	conteudo: string,
	idsUtilizados: Set<string>
): { conteudo: string; tabelas: TabelasProtegidas } {
	const tabelas: TabelasProtegidas = {};
	let resultado = conteudo;

	// Protege tabelas HTML (<table>...</table>)
	resultado = resultado.replace(
		/<table[\s\S]*?<\/table>/gi,
		(match) => {
			const id = gerarIdUnico(idsUtilizados);
			const placeholder = `<!--PROTECTED_TABLE_${id}-->`;
			tabelas[placeholder] = match;
			return placeholder;
		}
	);

	// Protege tabelas Markdown (linhas que começam com |)
	// Captura blocos contíguos de linhas de tabela
	resultado = resultado.replace(
		/(?:^\|.+\|$\n?)+/gm,
		(match) => {
			// Ignora se já foi protegido ou se é muito curto (pode ser separador)
			if (match.includes('<!--PROTECTED_TABLE_') || match.trim().length < 5) {
				return match;
			}
			const id = gerarIdUnico(idsUtilizados);
			const placeholder = `<!--PROTECTED_TABLE_${id}-->`;
			tabelas[placeholder] = match;
			return placeholder;
		}
	);

	return { conteudo: resultado, tabelas };
}

/**
 * Restaura tabelas dos placeholders
 */
export function restaurarTabelas(
	conteudo: string,
	tabelas: TabelasProtegidas
): string {
	let resultado = conteudo;
	for (const [placeholder, tabela] of Object.entries(tabelas)) {
		resultado = resultado.replace(placeholder, tabela);
	}
	return resultado;
}
