import { Plugin, Notice, TFile } from 'obsidian';
import { ProcessadorLegislacao } from './processador';

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

		console.log('Plugin Legislação Limpa carregado');
	}

	onunload() {
		console.log('Plugin Legislação Limpa descarregado');
	}
}
