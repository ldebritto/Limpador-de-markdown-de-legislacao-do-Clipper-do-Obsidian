import { TabelasProtegidas } from './types';
import { processarFrontmatter } from './frontmatter';
import { removerBrasao } from './brasao';
import { protegerTabelas, restaurarTabelas } from './tabelas';
import { converterHierarquia } from './hierarquia';
import { removerIndentacao } from './remover-indentacao';
import { converterNegrito } from './converter-negrito';
import { agruparRedacoesRevogadas } from './agrupar-revogadas';

/**
 * Classe principal que orquestra o processamento do documento
 */
export class ProcessadorLegislacao {
	private tabelasProtegidas: TabelasProtegidas = {};
	private idsUtilizados: Set<string> = new Set();

	/**
	 * Processa um documento de legislação completo
	 * @param conteudo Conteúdo markdown do documento
	 * @returns Documento processado
	 */
	processar(conteudo: string): string {
		let resultado = conteudo;

		// Etapa 1: Remover brasão (antes de proteger tabelas)
		resultado = this.removerBrasaoDoc(resultado);

		// Etapa 2: Proteger tabelas
		resultado = this.protegerTabelasDoc(resultado);

		// Etapa 3: Processar frontmatter e aliases
		resultado = this.processarFrontmatterDoc(resultado);

		// Etapa 4: Converter hierarquia em negrito para texto normal
		resultado = this.converterNegritoDoc(resultado);

		// Etapa 5: Remover indentação indesejada
		resultado = this.removerIndentacaoDoc(resultado);

		// Etapa 6: Converter hierarquia em headings
		resultado = this.converterHierarquiaDoc(resultado);

		// Etapa 7: Restaurar tabelas
		resultado = this.restaurarTabelasDoc(resultado);

		// Etapa 8: Agrupar redações revogadas em callouts retraídos
		resultado = this.agruparRevogadasDoc(resultado);

		return resultado;
	}

	/**
	 * Protege tabelas substituindo por placeholders
	 */
	private protegerTabelasDoc(conteudo: string): string {
		const resultado = protegerTabelas(conteudo, this.idsUtilizados);
		this.tabelasProtegidas = resultado.tabelas;
		return resultado.conteudo;
	}

	/**
	 * Restaura tabelas dos placeholders
	 */
	private restaurarTabelasDoc(conteudo: string): string {
		return restaurarTabelas(conteudo, this.tabelasProtegidas);
	}

	/**
	 * Processa frontmatter e gera aliases
	 */
	private processarFrontmatterDoc(conteudo: string): string {
		return processarFrontmatter(conteudo);
	}

	/**
	 * Remove o brasão da República do cabeçalho
	 */
	private removerBrasaoDoc(conteudo: string): string {
		return removerBrasao(conteudo);
	}

	/**
	 * Converte elementos de hierarquia em negrito para texto normal
	 */
	private converterNegritoDoc(conteudo: string): string {
		return converterNegrito(conteudo);
	}

	/**
	 * Remove indentação indesejada de elementos legais
	 */
	private removerIndentacaoDoc(conteudo: string): string {
		return removerIndentacao(conteudo);
	}

	/**
	 * Converte a hierarquia do documento em headings Markdown
	 */
	private converterHierarquiaDoc(conteudo: string): string {
		return converterHierarquia(conteudo);
	}

	/**
	 * Agrupa redações revogadas (linhas tachadas) em callouts retraídos
	 */
	private agruparRevogadasDoc(conteudo: string): string {
		return agruparRedacoesRevogadas(conteudo);
	}
}
