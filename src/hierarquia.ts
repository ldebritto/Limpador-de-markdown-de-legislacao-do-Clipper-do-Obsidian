/**
 * Converte a hierarquia do documento legal em headings Markdown
 *
 * Mapeamento:
 * - LIVRO / ANEXO → # (h1)
 * - TÍTULO → ## (h2)
 * - CAPÍTULO → ### (h3)
 * - Seção → #### (h4)
 * - Subseção → ##### (h5)
 *
 * Formato de saída: "# LIVRO I - NOME DO LIVRO"
 */

interface DivisaoConfig {
	pattern: RegExp;
	nivel: number;
}

const DIVISOES: DivisaoConfig[] = [
	{ pattern: /^(LIVRO\s+[IVXLCDM\d]+)$/i, nivel: 1 },
	{ pattern: /^(ANEXO\s+[IVXLCDM\d]+)$/i, nivel: 1 },
	{ pattern: /^(TÍTULO\s+[IVXLCDM\d]+)$/i, nivel: 2 },
	{ pattern: /^(CAPÍTULO\s+[IVXLCDM\d]+)$/i, nivel: 3 },
	{ pattern: /^(Seção\s+[IVXLCDM\d]+)$/i, nivel: 4 },
	{ pattern: /^(Subseção\s+[IVXLCDM\d]+)$/i, nivel: 5 },
];

/**
 * Regex para detectar se uma linha já é um heading processado
 * Formato: # DIVISÃO X ou # DIVISÃO X - Nome
 * Exemplo: "# LIVRO I - Das Obrigações", "## TÍTULO II", "### CAPÍTULO III - Dos Contratos"
 */
const JA_EH_HEADING = /^#{1,6}\s+(LIVRO|ANEXO|TÍTULO|CAPÍTULO|Seção|Subseção)\s+[IVXLCDM\d]+(\s*[-–—].*)?$/i;

/**
 * Converte hierarquia em headings Markdown
 * Une o identificador (ex: "LIVRO I") com o nome na linha seguinte
 * Ignora divisões dentro de blocos de citação (>) pois são referências a outras leis
 */
export function converterHierarquia(conteudo: string): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];
	let i = 0;

	while (i < linhas.length) {
		const linhaOriginal = linhas[i];
		const linhaAtual = linhaOriginal.trim();

		// Preserva headings já processados (ex: "# LIVRO I - Nome")
		// Isso evita reprocessamento e mantém ajustes manuais
		if (JA_EH_HEADING.test(linhaAtual)) {
			resultado.push(linhaOriginal);
			i++;
			continue;
		}

		// Ignora linhas dentro de citação (começam com >)
		// Estas são referências a outras leis, não divisões do documento atual
		if (linhaOriginal.trimStart().startsWith('>')) {
			resultado.push(linhaOriginal);
			i++;
			continue;
		}

		let encontrouDivisao = false;

		for (const divisao of DIVISOES) {
			const match = linhaAtual.match(divisao.pattern);
			if (match) {
				const identificador = match[1];
				const hashes = '#'.repeat(divisao.nivel);

				// Procura o nome da divisão nas próximas linhas (pulando linhas vazias)
				let nome = '';
				let proximaLinha = i + 1;

				// Pula linhas vazias
				while (proximaLinha < linhas.length && linhas[proximaLinha].trim() === '') {
					proximaLinha++;
				}

				// Verifica se a próxima linha não-vazia é o nome da divisão
				// (não deve ser outra divisão, artigo, ou linha especial)
				if (proximaLinha < linhas.length) {
					const candidato = linhas[proximaLinha].trim();
					if (candidato && !ehDivisaoOuArtigo(candidato)) {
						nome = candidato;
						// Remove as linhas vazias e a linha do nome do resultado
						i = proximaLinha;
					}
				}

				// Monta o heading
				if (nome) {
					resultado.push(`${hashes} ${identificador} - ${nome}`);
				} else {
					resultado.push(`${hashes} ${identificador}`);
				}

				encontrouDivisao = true;
				break;
			}
		}

		if (!encontrouDivisao) {
			resultado.push(linhas[i]);
		}

		i++;
	}

	return resultado.join('\n');
}

/**
 * Verifica se uma linha é uma divisão, artigo ou elemento especial
 * (não deve ser usada como nome de divisão)
 */
function ehDivisaoOuArtigo(linha: string): boolean {
	const padroes = [
		/^(LIVRO|ANEXO|TÍTULO|CAPÍTULO)\s+[IVXLCDM\d]+$/i,
		/^(Seção|Subseção)\s+[IVXLCDM\d]+$/i,
		/^Art\.\s*\d+/i,
		/^§\s*\d+/i,
		/^Parágrafo único/i,
		/^[IVXLCDM]+\s*[-–—]/,
		/^[a-z]\)\s*/,
		/^<!--/,  // comentários/placeholders
	];

	return padroes.some(p => p.test(linha));
}
