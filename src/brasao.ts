/**
 * Remove a tabela do brasão da República do cabeçalho do documento
 *
 * O padrão típico é:
 * | ![Brastra.gif...](url) | **Presidência da República...** |
 * | --- | --- |
 */
export function removerBrasao(conteudo: string): string {
	// Regex para identificar a tabela do brasão
	// Captura tabela markdown que contém imagem do brasão (Brastra.gif ou similar)
	const brasaoRegex = /\|\s*!\[.*?[Bb]ras.*?\]\(.*?\)\s*\|.*\|\n\|\s*---\s*\|\s*---\s*\|\n?/g;

	return conteudo.replace(brasaoRegex, '');
}
