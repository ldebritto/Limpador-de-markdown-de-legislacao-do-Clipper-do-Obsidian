/**
 * Detecta e marca versões duplicadas de dispositivos legais
 *
 * Quando o Planalto atualiza uma lei, ele mostra:
 * 1. Versão original (sem marcação)
 * 2. Versão alterada com "(Redação dada pela Lei Complementar nº X)"
 *
 * Este módulo converte a versão original em um callout para referência histórica.
 */

/**
 * Padrões de identificadores de dispositivos legais
 */
const IDENTIFICADORES = {
	artigo: /^(?:\*\*)?Art\.\s*(\d+[º°]?(?:-[A-Z])?)/i,
	paragrafo: /^§\s*(\d+[º°]?)/i,
	paragrafoUnico: /^Parágrafo único/i,
	inciso: /^([IVXLCDM]+)\s*[-–—]/,
	alinea: /^([a-z])\)/,
	item: /^(\d+)\\\./,
};

/**
 * Extrai o identificador de um dispositivo legal
 * Retorna null se não for um dispositivo reconhecido
 */
function extrairIdentificador(linha: string): string | null {
	const trimmed = linha.trim();

	for (const [tipo, regex] of Object.entries(IDENTIFICADORES)) {
		const match = trimmed.match(regex);
		if (match) {
			if (tipo === 'paragrafoUnico') {
				return 'Parágrafo único';
			}
			return `${tipo}:${match[1]}`;
		}
	}

	return null;
}

/**
 * Verifica se uma linha contém marcação de alteração legislativa
 */
function temMarcacaoAlteracao(linha: string): boolean {
	return /\[\(Redação dada pela/.test(linha);
}

/**
 * Processa duplicatas no documento
 * Converte versões originais em callouts quando seguidas de versão alterada
 */
export function processarDuplicatas(conteudo: string): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];
	let i = 0;

	while (i < linhas.length) {
		const linhaAtual = linhas[i];
		const idAtual = extrairIdentificador(linhaAtual);

		// Se não é um dispositivo legal, apenas adiciona
		if (!idAtual) {
			resultado.push(linhaAtual);
			i++;
			continue;
		}

		// Procura a próxima linha não-vazia
		let j = i + 1;
		while (j < linhas.length && linhas[j].trim() === '') {
			j++;
		}

		// Verifica se a próxima linha é o mesmo dispositivo com alteração
		if (j < linhas.length) {
			const proximaLinha = linhas[j];
			const idProxima = extrairIdentificador(proximaLinha);

			// Se é o mesmo identificador e a próxima tem marcação de alteração
			if (idProxima === idAtual && temMarcacaoAlteracao(proximaLinha)) {
				// Converte a versão original em callout
				resultado.push('> [!note]- Redação original');
				resultado.push(`> ${linhaAtual.trim()}`);
				resultado.push('');

				// Pula para a versão alterada (será processada no próximo loop)
				i = j;
				continue;
			}
		}

		// Não é duplicata, adiciona normalmente
		resultado.push(linhaAtual);
		i++;
	}

	return resultado.join('\n');
}
