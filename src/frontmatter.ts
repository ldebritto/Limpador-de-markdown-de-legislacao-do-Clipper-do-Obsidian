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
 * Processa o frontmatter do documento, adicionando aliases
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

	const aliases = gerarAliases(titulo);

	// Formata aliases como array YAML
	const aliasesYaml = `aliases:\n${aliases.map(a => `  - "${a}"`).join('\n')}`;

	// Verifica se já existe campo aliases
	if (/^aliases:/m.test(frontmatterOriginal)) {
		// Substitui aliases existente (usa [\s\S] em vez de . com flag s)
		const novoFrontmatter = frontmatterOriginal.replace(
			/^aliases:[\s\S]*?(?=\n\w|\n$)/m,
			aliasesYaml
		);
		return conteudo.replace(frontmatterRegex, `---\n${novoFrontmatter}\n---`);
	} else {
		// Adiciona aliases ao final do frontmatter
		const novoFrontmatter = `${frontmatterOriginal}\n${aliasesYaml}`;
		return conteudo.replace(frontmatterRegex, `---\n${novoFrontmatter}\n---`);
	}
}
