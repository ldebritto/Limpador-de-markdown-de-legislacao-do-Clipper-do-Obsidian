import { gerarIdUnico } from './utils';
import { MapaIds } from './extrator-ids';

/**
 * Regex para detectar se uma linha já possui um ID de deeplink no final
 * Formato: espaço + ^ + 6 caracteres alfanuméricos minúsculos/números
 */
const JA_TEM_ID = /\s\^[a-z0-9]{6}$/;

/**
 * Padrões para identificar dispositivos legais
 */
const DISPOSITIVOS = {
	artigo: /^\*\*Art\.\s*(\d+[º°]?(?:-[A-Z])?)\*\*/,
	paragrafo: /^§\s*(\d+[º°]?)/,
	paragrafoUnico: /^Parágrafo único/i,
	inciso: /^([IVXLCDM]+)\s*[-–—]/,
	alinea: /^([a-z])\)/,
};

/**
 * Adiciona IDs únicos (^id) ao final de elementos legais para permitir deeplinks no Obsidian
 *
 * Elementos processados:
 * - Artigos: Art. 1º, Art. 2º, etc.
 * - Parágrafos: § 1º, § 2º, Parágrafo único
 * - Incisos: I -, II -, III -, etc. (numeração romana)
 * - Alíneas: a), b), c), etc.
 *
 * Se idsExistentes for fornecido, reutiliza IDs para dispositivos que já existiam.
 * Linhas que já possuem ID (^xxxxxx) são preservadas e não recebem novo ID.
 */
export function adicionarDeeplinks(
	conteudo: string,
	idsUtilizados: Set<string>,
	idsExistentes?: MapaIds
): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];

	// Contexto atual para construir identificadores completos
	let artigoAtual: string | null = null;
	let paragrafoAtual: string | null = null;
	let incisoAtual: string | null = null;

	for (const linha of linhas) {
		const trimmed = linha.trim();

		// Se já tem ID, preserva
		if (JA_TEM_ID.test(trimmed)) {
			resultado.push(linha);
			// Ainda atualiza contexto
			atualizarContexto(trimmed);
			continue;
		}

		// Detecta tipo de dispositivo e adiciona ID
		const { tipo, chave, novaLinha } = processarLinha(linha, trimmed);

		if (tipo && chave) {
			// Verifica se existe ID no mapa de existentes
			let id: string;
			if (idsExistentes?.has(chave)) {
				id = idsExistentes.get(chave)!;
				idsUtilizados.add(id);
			} else {
				id = gerarIdUnico(idsUtilizados);
			}
			resultado.push(`${novaLinha} ^${id}`);
		} else {
			resultado.push(linha);
		}
	}

	return resultado.join('\n');

	/**
	 * Atualiza o contexto baseado na linha
	 */
	function atualizarContexto(linha: string) {
		const artigoMatch = linha.match(DISPOSITIVOS.artigo);
		if (artigoMatch) {
			artigoAtual = `Art. ${artigoMatch[1]}`;
			paragrafoAtual = null;
			incisoAtual = null;
			return;
		}

		if (DISPOSITIVOS.paragrafoUnico.test(linha)) {
			paragrafoAtual = 'Parágrafo único';
			incisoAtual = null;
			return;
		}

		const paragrafoMatch = linha.match(DISPOSITIVOS.paragrafo);
		if (paragrafoMatch) {
			paragrafoAtual = `§ ${paragrafoMatch[1]}`;
			incisoAtual = null;
			return;
		}

		const incisoMatch = linha.match(DISPOSITIVOS.inciso);
		if (incisoMatch) {
			incisoAtual = incisoMatch[1];
			return;
		}
	}

	/**
	 * Processa uma linha e retorna tipo, chave e linha modificada
	 */
	function processarLinha(linhaOriginal: string, trimmed: string): {
		tipo: string | null;
		chave: string | null;
		novaLinha: string;
	} {
		// Artigo
		const artigoMatch = trimmed.match(DISPOSITIVOS.artigo);
		if (artigoMatch) {
			artigoAtual = `Art. ${artigoMatch[1]}`;
			paragrafoAtual = null;
			incisoAtual = null;
			return {
				tipo: 'artigo',
				chave: artigoAtual,
				novaLinha: linhaOriginal,
			};
		}

		// Parágrafo único
		if (DISPOSITIVOS.paragrafoUnico.test(trimmed)) {
			paragrafoAtual = 'Parágrafo único';
			incisoAtual = null;
			const chave = artigoAtual ? `Parágrafo único do ${artigoAtual}` : null;
			return {
				tipo: 'paragrafoUnico',
				chave,
				novaLinha: linhaOriginal,
			};
		}

		// Parágrafo numerado
		const paragrafoMatch = trimmed.match(DISPOSITIVOS.paragrafo);
		if (paragrafoMatch) {
			const num = `§ ${paragrafoMatch[1]}`;
			paragrafoAtual = num;
			incisoAtual = null;
			const chave = artigoAtual ? `${num} do ${artigoAtual}` : null;
			return {
				tipo: 'paragrafo',
				chave,
				novaLinha: linhaOriginal,
			};
		}

		// Inciso
		const incisoMatch = trimmed.match(DISPOSITIVOS.inciso);
		if (incisoMatch) {
			const num = incisoMatch[1];
			incisoAtual = num;

			let contexto = artigoAtual;
			if (paragrafoAtual && artigoAtual) {
				contexto = `${paragrafoAtual} do ${artigoAtual}`;
			}
			const chave = contexto ? `${num} do ${contexto}` : null;

			return {
				tipo: 'inciso',
				chave,
				novaLinha: linhaOriginal,
			};
		}

		// Alínea
		const alineaMatch = trimmed.match(DISPOSITIVOS.alinea);
		if (alineaMatch) {
			const letra = alineaMatch[1];

			let contexto = artigoAtual;
			if (incisoAtual) {
				if (paragrafoAtual && artigoAtual) {
					contexto = `${incisoAtual} do ${paragrafoAtual} do ${artigoAtual}`;
				} else if (artigoAtual) {
					contexto = `${incisoAtual} do ${artigoAtual}`;
				}
			} else if (paragrafoAtual && artigoAtual) {
				contexto = `${paragrafoAtual} do ${artigoAtual}`;
			}
			const chave = contexto ? `${letra}) do ${contexto}` : null;

			return {
				tipo: 'alinea',
				chave,
				novaLinha: linhaOriginal,
			};
		}

		// Não é dispositivo legal
		return {
			tipo: null,
			chave: null,
			novaLinha: linhaOriginal,
		};
	}
}
