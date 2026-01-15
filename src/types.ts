/**
 * Representa o frontmatter parseado de um documento de legislação
 */
export interface LegislacaoFrontmatter {
	titulo: string;
	fonte: string;
	autor?: string;
	publicado?: string;
	criado: string;
	descricao: string;
	tags?: string[];
	aliases?: string[];
}

/**
 * Resultado do parsing de um documento
 */
export interface DocumentoParsed {
	frontmatter: LegislacaoFrontmatter;
	conteudo: string;
}

/**
 * Informações extraídas do título do documento normativo
 */
export interface TituloNormativo {
	tipoCompleto: string;    // "Lei Complementar"
	tipoAbreviado: string;   // "LC"
	numero: string;          // "227"
	ano: string;             // "2026"
}

/**
 * Mapa de tabelas protegidas durante o processamento
 */
export interface TabelasProtegidas {
	[placeholder: string]: string;
}
