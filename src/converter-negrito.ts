/**
 * Converte elementos de hierarquia em negrito para formato normal
 *
 * Problema: O Web Clipper às vezes preserva a formatação em negrito
 * do site original, criando linhas como:
 *   **TÍTULO I**
 *   **Dos Princípios Fundamentais**
 *
 * Solução: Remove o negrito desses elementos para que possam ser
 * processados corretamente pelo converterHierarquia
 */

/**
 * Padrões que identificam divisões hierárquicas em negrito
 * que devem ser convertidas para texto normal
 *
 * Nota: Aceita numeração com hífens (ex: V-A, I-B) comum em seções
 */
const DIVISOES_EM_NEGRITO = [
	/^\*\*(LIVRO\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
	/^\*\*(ANEXO\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
	/^\*\*(TÍTULO\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
	/^\*\*(CAPÍTULO\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
	/^\*\*(Seção\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
	/^\*\*(Subseção\s+[IVXLCDM\d]+(?:-[A-Z])?)\*\*$/i,
];

/**
 * Verifica se uma linha é uma divisão hierárquica em negrito
 */
function ehDivisaoEmNegrito(linha: string): boolean {
	const linhaTrimmed = linha.trim();
	return DIVISOES_EM_NEGRITO.some(pattern => pattern.test(linhaTrimmed));
}

/**
 * Verifica se a linha é um nome de divisão (provável continuação)
 * Nomes geralmente começam com maiúscula e não são elementos legais
 */
function ehProvavelNomeDivisao(linha: string): boolean {
	const linhaTrimmed = linha.trim();

	// Remove negrito se houver
	const semNegrito = linhaTrimmed.replace(/^\*\*(.+)\*\*$/, '$1');

	// Não pode ser vazio
	if (!semNegrito) return false;

	// Não pode ser outro elemento legal
	const elementosLegais = [
		/^Art\.\s/i,
		/^§\s*\d+/i,
		/^Parágrafo único/i,
		/^[IVXLCDM]+\s*[-–—]/,
		/^[a-z]\)\s/,
		/^(LIVRO|ANEXO|TÍTULO|CAPÍTULO|Seção|Subseção)\s+[IVXLCDM\d]+(?:-[A-Z])?$/i,
	];

	if (elementosLegais.some(p => p.test(semNegrito))) {
		return false;
	}

	// Se está em negrito e começa com maiúscula, provavelmente é nome
	return /^\*\*[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ]/.test(linhaTrimmed);
}

/**
 * Remove o negrito de uma linha
 */
function removerNegrito(linha: string): string {
	return linha.replace(/^\*\*(.+)\*\*$/, '$1');
}

/**
 * Converte elementos de hierarquia em negrito para texto normal
 *
 * Exemplos de conversão:
 * **TÍTULO I**                    → TÍTULO I
 * **Dos Princípios Fundamentais** → Dos Princípios Fundamentais
 *
 * **LIVRO I**                     → LIVRO I
 * **Nome do Livro**               → Nome do Livro
 *
 * Isso permite que o converterHierarquia (executado depois) processe
 * corretamente e transforme em headings:
 * TÍTULO I + Dos Princípios Fundamentais → ## TÍTULO I - Dos Princípios Fundamentais
 */
export function converterNegrito(conteudo: string): string {
	const linhas = conteudo.split('\n');
	const resultado: string[] = [];

	for (let i = 0; i < linhas.length; i++) {
		const linha = linhas[i];
		const linhaTrimmed = linha.trim();

		// Se é uma divisão em negrito, remove o negrito
		if (ehDivisaoEmNegrito(linha)) {
			resultado.push(removerNegrito(linhaTrimmed));
			continue;
		}

		// Se é provável nome de divisão em negrito, também remove
		// (será usado pelo converterHierarquia para unir com a divisão)
		if (ehProvavelNomeDivisao(linha)) {
			// Verifica se a linha anterior foi uma divisão
			// ou se está seguindo uma linha vazia após uma divisão
			let podeSerNome = false;

			if (i > 0) {
				// Verifica linha anterior
				const anterior = linhas[i - 1].trim();
				if (DIVISOES_EM_NEGRITO.some(p => p.test(`**${anterior}**`)) ||
					DIVISOES_EM_NEGRITO.some(p => p.test(anterior))) {
					podeSerNome = true;
				}

				// Ou duas linhas antes se a anterior for vazia
				if (i > 1 && anterior === '') {
					const duasAtras = linhas[i - 2].trim();
					if (DIVISOES_EM_NEGRITO.some(p => p.test(`**${duasAtras}**`)) ||
						DIVISOES_EM_NEGRITO.some(p => p.test(duasAtras))) {
						podeSerNome = true;
					}
				}
			}

			if (podeSerNome) {
				resultado.push(removerNegrito(linhaTrimmed));
				continue;
			}
		}

		// Outras linhas permanecem como estão
		resultado.push(linha);
	}

	return resultado.join('\n');
}
