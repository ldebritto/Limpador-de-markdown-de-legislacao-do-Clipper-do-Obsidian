import { TabelasProtegidas } from './types';
import { processarFrontmatter } from './frontmatter';
import { removerBrasao } from './brasao';
import { protegerTabelas, restaurarTabelas } from './tabelas';
import { converterHierarquia } from './hierarquia';
import { adicionarDeeplinks } from './deeplinks';
import { normalizarArtigos } from './artigos';
import { normalizarTextoClipado } from './normalizacao';
import { processarDuplicatas } from './duplicatas';

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

		// Etapa 0: Normalizar texto clipado (corrigir Art**.** etc)
		resultado = this.normalizarTextoClipadoDoc(resultado);

		// Etapa 0.5: Processar duplicatas (versões originais → callout)
		resultado = this.processarDuplicatasDoc(resultado);

		// Etapa 1: Remover brasão (antes de proteger tabelas)
		resultado = this.removerBrasaoDoc(resultado);

		// Etapa 2: Proteger tabelas
		resultado = this.protegerTabelasDoc(resultado);

		// Etapa 3: Processar frontmatter e aliases
		resultado = this.processarFrontmatterDoc(resultado);

		// Etapa 4: Converter hierarquia em headings
		resultado = this.converterHierarquiaDoc(resultado);

		// Etapa 5: Normalizar artigos (remover tabs, padronizar negrito)
		resultado = this.normalizarArtigosDoc(resultado);

		// Etapa 6: Adicionar IDs únicos
		resultado = this.adicionarIdsDoc(resultado);

		// Etapa final: Restaurar tabelas
		resultado = this.restaurarTabelasDoc(resultado);

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
	 * Converte a hierarquia do documento em headings Markdown
	 */
	private converterHierarquiaDoc(conteudo: string): string {
		return converterHierarquia(conteudo);
	}

	/**
	 * Normaliza formatação dos artigos (remove tabs, adiciona negrito)
	 */
	private normalizarArtigosDoc(conteudo: string): string {
		return normalizarArtigos(conteudo);
	}

	/**
	 * Adiciona IDs únicos para deeplinks
	 */
	private adicionarIdsDoc(conteudo: string): string {
		return adicionarDeeplinks(conteudo, this.idsUtilizados);
	}

	/**
	 * Normaliza texto clipado (corrige Art**.** etc)
	 */
	private normalizarTextoClipadoDoc(conteudo: string): string {
		return normalizarTextoClipado(conteudo);
	}

	/**
	 * Processa duplicatas (versões originais → callout)
	 */
	private processarDuplicatasDoc(conteudo: string): string {
		return processarDuplicatas(conteudo);
	}
}
