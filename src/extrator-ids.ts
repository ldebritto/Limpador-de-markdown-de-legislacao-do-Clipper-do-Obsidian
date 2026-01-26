/**
 * Extrai mapa de IDs de dispositivos legais de um documento já processado
 *
 * Usado para preservar IDs ao atualizar uma legislação
 */

/**
 * Mapa de identificadores para IDs
 * Chave: identificador completo (ex: "Art. 1º", "§ 1º do Art. 3º", "I do Art. 5º")
 * Valor: ID de 6 caracteres
 */
export type MapaIds = Map<string, string>;

/**
 * Regex para extrair IDs de uma linha
 * Pode haver múltiplos IDs (bug de processamento anterior)
 * Captura todos e usa o primeiro
 */
const ID_REGEX = /\^([a-z0-9]{6})/g;

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
 * Extrai IDs de um documento processado
 * Retorna um mapa de identificador completo → ID
 */
export function extrairIds(conteudo: string): MapaIds {
	const mapa: MapaIds = new Map();
	const linhas = conteudo.split('\n');

	// Contexto atual para construir identificadores completos
	let artigoAtual: string | null = null;
	let paragrafoAtual: string | null = null;
	let incisoAtual: string | null = null;

	for (const linha of linhas) {
		const trimmed = linha.trim();
		if (!trimmed) continue;

		// Extrai ID se existir (usa o primeiro se houver múltiplos)
		const ids = [...trimmed.matchAll(ID_REGEX)];
		const id = ids.length > 0 ? ids[0][1] : null;

		// Detecta artigo (atualiza contexto mesmo sem ID)
		const artigoMatch = trimmed.match(DISPOSITIVOS.artigo);
		if (artigoMatch) {
			artigoAtual = `Art. ${artigoMatch[1]}`;
			paragrafoAtual = null;
			incisoAtual = null;
			if (id) {
				mapa.set(artigoAtual, id);
			}
			continue;
		}

		// Detecta parágrafo único
		if (DISPOSITIVOS.paragrafoUnico.test(trimmed)) {
			paragrafoAtual = 'Parágrafo único';
			incisoAtual = null;
			if (id && artigoAtual) {
				const chave = `Parágrafo único do ${artigoAtual}`;
				mapa.set(chave, id);
			}
			continue;
		}

		// Detecta parágrafo numerado
		const paragrafoMatch = trimmed.match(DISPOSITIVOS.paragrafo);
		if (paragrafoMatch) {
			const numParagrafo = `§ ${paragrafoMatch[1]}`;
			paragrafoAtual = numParagrafo;
			incisoAtual = null;
			if (id && artigoAtual) {
				const chave = `${numParagrafo} do ${artigoAtual}`;
				mapa.set(chave, id);
			}
			continue;
		}

		// Detecta inciso
		const incisoMatch = trimmed.match(DISPOSITIVOS.inciso);
		if (incisoMatch) {
			const numInciso = incisoMatch[1];
			incisoAtual = numInciso;

			if (id) {
				// Determina o contexto (pode ser de artigo, parágrafo, etc)
				let contexto = artigoAtual;
				if (paragrafoAtual && artigoAtual) {
					contexto = `${paragrafoAtual} do ${artigoAtual}`;
				}

				if (contexto) {
					const chave = `${numInciso} do ${contexto}`;
					mapa.set(chave, id);
				}
			}
			continue;
		}

		// Detecta alínea
		const alineaMatch = trimmed.match(DISPOSITIVOS.alinea);
		if (alineaMatch) {
			const letra = alineaMatch[1];

			if (id) {
				// Determina o contexto (pode ser de inciso, parágrafo, etc)
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

				if (contexto) {
					const chave = `${letra}) do ${contexto}`;
					mapa.set(chave, id);
				}
			}
			continue;
		}
	}

	return mapa;
}

/**
 * Exibe o mapa de IDs de forma legível (para debug)
 */
export function exibirMapaIds(mapa: MapaIds): string {
	const linhas: string[] = [];
	for (const [chave, valor] of mapa) {
		linhas.push(`${chave}: ^${valor}`);
	}
	return linhas.join('\n');
}
