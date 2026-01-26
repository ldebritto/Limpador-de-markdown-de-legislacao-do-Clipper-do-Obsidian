import { TituloNormativo } from './types';

/**
 * Mapa de tipos normativos para suas abreviações
 */
const TIPOS_NORMATIVOS: Record<string, string> = {
	'lei complementar': 'LC',
	'lei ordinária': 'LO',
	'lei': 'L',
	'decreto-lei': 'DL',
	'decreto': 'D',
	'medida provisória': 'MP',
	'emenda constitucional': 'EC',
	'resolução': 'Res',
	'portaria': 'Port',
	'instrução normativa': 'IN',
};

/**
 * Extrai informações do título normativo a partir do texto do documento
 * Busca padrões como "LEI COMPLEMENTAR Nº 227, DE 13 DE JANEIRO DE 2026"
 */
export function extrairTituloNormativo(conteudo: string): TituloNormativo | null {
	// Regex para capturar o título formal do documento
	// Exemplo: **[LEI COMPLEMENTAR Nº 227, DE 13 DE JANEIRO DE 2026](...)**
	const regex = /\*\*\[?(LEI COMPLEMENTAR|LEI ORDINÁRIA|LEI|DECRETO-LEI|DECRETO|MEDIDA PROVISÓRIA|EMENDA CONSTITUCIONAL|RESOLUÇÃO|PORTARIA|INSTRUÇÃO NORMATIVA)\s*[Nn]?[ºª°]?\s*(\d+(?:\.\d+)?),?\s*DE\s*\d+\s*DE\s*\w+\s*DE\s*(\d{4})/i;

	const match = conteudo.match(regex);

	if (!match) {
		return null;
	}

	const tipoCompleto = capitalizarTipo(match[1]);
	const tipoLower = match[1].toLowerCase();
	const tipoAbreviado = TIPOS_NORMATIVOS[tipoLower] || tipoCompleto.substring(0, 2).toUpperCase();
	const numero = match[2];
	const ano = match[3];

	return {
		tipoCompleto,
		tipoAbreviado,
		numero,
		ano,
	};
}

/**
 * Capitaliza o tipo normativo corretamente
 * "LEI COMPLEMENTAR" -> "Lei Complementar"
 */
function capitalizarTipo(tipo: string): string {
	return tipo
		.toLowerCase()
		.split(' ')
		.map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
		.join(' ');
}

/**
 * Gera os 4 formatos de aliases a partir do título normativo
 */
export function gerarAliases(titulo: TituloNormativo): string[] {
	const { tipoCompleto, tipoAbreviado, numero, ano } = titulo;

	return [
		`${tipoCompleto} nº ${numero}/${ano}`,      // Lei Complementar nº 227/2026
		`${tipoAbreviado} nº ${numero}/${ano}`,     // LC nº 227/2026
		`${tipoCompleto} ${numero}/${ano}`,         // Lei Complementar 227/2026
		`${tipoAbreviado} ${numero}/${ano}`,        // LC 227/2026
	];
}

/**
 * Extrai aliases existentes do frontmatter
 * Suporta formatos: array YAML em múltiplas linhas ou inline
 */
function extrairAliasesExistentes(frontmatter: string): string[] {
	const aliases: string[] = [];

	// Formato de múltiplas linhas:
	// aliases:
	//   - "alias1"
	//   - "alias2"
	const multiLinhaMatch = frontmatter.match(/^aliases:\s*\n((?:\s+-\s*.+\n?)*)/m);
	if (multiLinhaMatch) {
		const linhas = multiLinhaMatch[1].split('\n');
		for (const linha of linhas) {
			const itemMatch = linha.match(/^\s+-\s*["']?([^"'\n]+)["']?\s*$/);
			if (itemMatch) {
				aliases.push(itemMatch[1].trim());
			}
		}
		return aliases;
	}

	// Formato inline: aliases: ["alias1", "alias2"]
	const inlineMatch = frontmatter.match(/^aliases:\s*\[([^\]]*)\]/m);
	if (inlineMatch) {
		const items = inlineMatch[1].split(',');
		for (const item of items) {
			const clean = item.trim().replace(/^["']|["']$/g, '');
			if (clean) {
				aliases.push(clean);
			}
		}
	}

	return aliases;
}

/**
 * Remove o campo aliases existente do frontmatter
 * Trata múltiplas linhas (array YAML) e formato inline
 */
function removerAliasesExistentes(frontmatter: string): string {
	const linhas = frontmatter.split('\n');
	const resultado: string[] = [];
	let dentroDeAliases = false;

	for (const linha of linhas) {
		// Detecta início do campo aliases
		if (/^aliases:/.test(linha)) {
			dentroDeAliases = true;
			// Se for formato inline (aliases: ["a", "b"]), remove só essa linha
			if (/^aliases:\s*\[/.test(linha)) {
				dentroDeAliases = false;
			}
			continue;
		}

		// Se estamos dentro do array de aliases, pular linhas indentadas (itens do array)
		if (dentroDeAliases) {
			// Linha indentada (item do array) - pular
			if (/^\s+-/.test(linha) || /^\s+["']/.test(linha)) {
				continue;
			}
			// Linha não indentada - fim do array aliases
			dentroDeAliases = false;
		}

		resultado.push(linha);
	}

	return resultado.join('\n');
}

/**
 * Processa o frontmatter do documento, adicionando ou mesclando aliases
 * Aliases existentes são preservados; novos aliases são adicionados sem duplicatas
 */
export function processarFrontmatter(conteudo: string): string {
	// Verifica se tem frontmatter
	const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
	const match = conteudo.match(frontmatterRegex);

	if (!match) {
		return conteudo;
	}

	const frontmatterOriginal = match[1];
	const titulo = extrairTituloNormativo(conteudo);

	if (!titulo) {
		return conteudo;
	}

	const novosAliases = gerarAliases(titulo);
	const aliasesExistentes = extrairAliasesExistentes(frontmatterOriginal);

	// Mescla aliases: existentes primeiro, depois novos (sem duplicatas)
	const aliasesSet = new Set(aliasesExistentes);
	for (const alias of novosAliases) {
		aliasesSet.add(alias);
	}
	const aliasesMesclados = Array.from(aliasesSet);

	// Formata aliases como array YAML
	const aliasesYaml = `aliases:\n${aliasesMesclados.map(a => `  - "${a}"`).join('\n')}`;

	// Remove aliases existentes e adiciona o novo bloco mesclado
	const frontmatterSemAliases = removerAliasesExistentes(frontmatterOriginal);
	const novoFrontmatter = frontmatterSemAliases.trim()
		? `${frontmatterSemAliases}\n${aliasesYaml}`
		: aliasesYaml;

	return conteudo.replace(frontmatterRegex, `---\n${novoFrontmatter}\n---`);
}
