/**
 * Normaliza a formatação de artigos produzida pelo Web Clipper
 *
 * Problemas resolvidos:
 * 1. Negrito ao redor de pontos: Art**.** 2º → Art. 2º
 *    ou Art. 13**.**O → Art. 13. O
 * 2. Falta de espaço entre designação e texto: Art. 1ºFicam → Art. 1º Ficam
 *    ou Art. 10.Considera-se → Art. 10. Considera-se
 *
 * Deve ocorrer DEPOIS de converter negrito e ANTES de remover indentação
 */
export function normalizarArtigos(conteudo: string): string {
	let resultado = conteudo;

	// Remove negrito ao redor do ponto após "Art": Art**.** 2º → Art. 2º
	resultado = resultado.replace(/^(\s*Art)\*\*\.\*\*/gm, '$1.');

	// Remove negrito ao redor do ponto após número: Art. 13**.** → Art. 13.
	resultado = resultado.replace(/^(\s*Art\.\s*\d+[º°]?(?:-[A-Z])?)\*\*\.\*\*/gm, '$1.');

	// Garante espaço entre designação do artigo e o texto
	// Caso 1: Ponto seguido de texto sem espaço
	// Art. 10.Considera → Art. 10. Considera
	// Art. 7º-A.Caso → Art. 7º-A. Caso
	resultado = resultado.replace(
		/^(\s*Art\.\s*\d+[º°]?(?:-[A-Z])?\.)(\S)/gm,
		'$1 $2'
	);

	// Caso 2: Ordinal seguido de texto sem espaço (sem ponto ou hífen após)
	// Art. 1ºFicam → Art. 1º Ficam
	resultado = resultado.replace(
		/^(\s*Art\.\s*\d+[º°](?:-[A-Z])?)(?![-\.])(\S)/gm,
		'$1 $2'
	);

	return resultado;
}
