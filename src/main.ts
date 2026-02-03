import { Plugin, Notice, TFile } from 'obsidian';
import { ProcessadorLegislacao } from './processador';
import { limparIdsDuplicados } from './limpar-duplicatas';

export default class LegislacaoLimpaPlugin extends Plugin {
	private processador: ProcessadorLegislacao;

	async onload() {
		this.processador = new ProcessadorLegislacao();

		// Comando principal para processar o arquivo ativo
		this.addCommand({
			id: 'processar-legislacao',
			name: 'Processar documento de legislação',
			editorCallback: async (editor, view) => {
				const arquivo = view.file;
				if (!arquivo) {
					new Notice('Nenhum arquivo aberto');
					return;
				}

				try {
					const conteudoOriginal = editor.getValue();
					const conteudoProcessado = this.processador.processar(conteudoOriginal);

					editor.setValue(conteudoProcessado);
					new Notice('Documento processado com sucesso!');
				} catch (erro) {
					console.error('Erro ao processar documento:', erro);
					new Notice('Erro ao processar documento. Verifique o console.');
				}
			}
		});

		// Comando para limpar IDs duplicados (versão inteligente com busca no vault)
		this.addCommand({
			id: 'limpar-ids-duplicados',
			name: 'Limpar IDs duplicados (buscar referências)',
			editorCallback: async (editor, view) => {
				const arquivo = view.file;
				if (!arquivo) {
					new Notice('Nenhum arquivo aberto');
					return;
				}

				try {
					new Notice('Buscando IDs duplicados e referências no vault...');

					const conteudoOriginal = editor.getValue();
					const resultado = await limparIdsDuplicados(
						this.app.vault,
						arquivo,
						conteudoOriginal
					);

					if (resultado.conteudo !== conteudoOriginal) {
						editor.setValue(resultado.conteudo);

						// Mostra relatório no console
						console.log('=== Relatório de Limpeza de IDs Duplicados ===');
						resultado.relatorio.forEach(linha => console.log(linha));

						new Notice('IDs duplicados removidos! Veja o console para detalhes.');
					} else {
						new Notice('Nenhum ID duplicado encontrado.');
					}
				} catch (erro) {
					console.error('Erro ao limpar IDs duplicados:', erro);
					new Notice('Erro ao limpar IDs duplicados. Verifique o console.');
				}
			}
		});

		console.log('Plugin Legislação Limpa carregado');
	}

	onunload() {
		console.log('Plugin Legislação Limpa descarregado');
	}
}
