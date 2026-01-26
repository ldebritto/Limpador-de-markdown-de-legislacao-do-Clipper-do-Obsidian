/**
 * Normaliza problemas de formatação comuns em documentos clipados do Planalto
 *
 * Problemas corrigidos:
 * - Art**.** 2º → Art. 2º (negrito quebrado)
 * - Art. 1ºFicam → Art. 1º Ficam (falta de espaço)
 * - Art. 13**.**O valor → Art. 13. O valor
 */

/**
 * Corrige artigos com negrito quebrado
 * Exemplo: "Art**.** 2º" → "Art. 2º"
 * Exemplo: "Art. 13**.**O" → "Art. 13. O"
 */
function corrigirNegritoQuebrado(conteudo: string): string {
	// Padrão 1: Art**.** no início
	let resultado = conteudo.replace(/Art\*\*\.\*\*\s*/g, 'Art. ');

	// Padrão 2: Art. X**.**texto (negrito após número)
	resultado = resultado.replace(
		/^(Art\.\s*\d+)\*\*\.\*\*([A-ZÀ-Ú])/gm,
		'$1. $2'
	);

	return resultado;
}

/**
 * Corrige artigos sem espaço entre número e texto
 * Exemplo: "Art. 1ºFicam" → "Art. 1º Ficam"
 * Exemplo: "Art. 2ºO IBS" → "Art. 2º O IBS"
 */
function corrigirEspacoAposNumero(conteudo: string): string {
	// Padrão: Art. Xº seguido de letra maiúscula sem espaço
	return conteudo.replace(
		/^(Art\.\s*\d+[º°](?:-[A-Z])?)([A-ZÀ-Ú])/gm,
		'$1 $2'
	);
}

/**
 * Corrige parágrafos sem espaço entre número e texto
 * Exemplo: "§ 1ºPara fins" → "§ 1º Para fins"
 */
function corrigirEspacoParagrafo(conteudo: string): string {
	return conteudo.replace(
		/^(§\s*\d+[º°])([A-ZÀ-Ú])/gm,
		'$1 $2'
	);
}

/**
 * Remove espaços duplicados
 */
function removerEspacosDuplicados(conteudo: string): string {
	return conteudo.replace(/  +/g, ' ');
}

/**
 * Normaliza o texto clipado corrigindo problemas de formatação
 * Esta função deve ser executada ANTES do processamento normal
 */
export function normalizarTextoClipado(conteudo: string): string {
	let resultado = conteudo;

	// Ordem importa: primeiro corrigir negrito, depois espaços
	resultado = corrigirNegritoQuebrado(resultado);
	resultado = corrigirEspacoAposNumero(resultado);
	resultado = corrigirEspacoParagrafo(resultado);
	resultado = removerEspacosDuplicados(resultado);

	return resultado;
}
