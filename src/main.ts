import { Plugin, Notice, TFile, FuzzySuggestModal, App } from 'obsidian';
import { ProcessadorLegislacao } from './processador';
import { atualizarLegislacao } from './atualizador';

/**
 * Modal para selecionar um arquivo de legislação existente
 */
class SeletorArquivoModal extends FuzzySuggestModal<TFile> {
	private arquivos: TFile[];
	private onEscolha: (arquivo: TFile) => void;

	constructor(app: App, arquivos: TFile[], onEscolha: (arquivo: TFile) => void) {
		super(app);
		this.arquivos = arquivos;
		this.onEscolha = onEscolha;
		this.setPlaceholder('Selecione o arquivo de legislação existente para atualizar');
	}

	getItems(): TFile[] {
		return this.arquivos;
	}

	getItemText(item: TFile): string {
		return item.basename;
	}

	onChooseItem(item: TFile): void {
		this.onEscolha(item);
	}
}

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

		// Comando para atualizar legislação existente com nova versão
		this.addCommand({
			id: 'atualizar-legislacao',
			name: 'Atualizar legislação com nova versão',
			editorCallback: async (editor, view) => {
				const arquivoNovo = view.file;
				if (!arquivoNovo) {
					new Notice('Nenhum arquivo aberto');
					return;
				}

				// Lista todos os arquivos markdown exceto o atual
				const arquivos = this.app.vault.getMarkdownFiles()
					.filter(f => f.path !== arquivoNovo.path)
					.sort((a, b) => a.basename.localeCompare(b.basename));

				if (arquivos.length === 0) {
					new Notice('Nenhum outro arquivo encontrado no vault');
					return;
				}

				// Abre modal para selecionar o arquivo existente
				new SeletorArquivoModal(this.app, arquivos, async (arquivoExistente) => {
					try {
						const conteudoNovo = editor.getValue();
						const conteudoExistente = await this.app.vault.read(arquivoExistente);

						const resultado = atualizarLegislacao(conteudoExistente, conteudoNovo);

						// Atualiza o arquivo existente com o conteúdo mesclado
						await this.app.vault.modify(arquivoExistente, resultado.conteudo);

						// Mostra estatísticas
						new Notice(
							`Legislação atualizada!\n` +
							`IDs reutilizados: ${resultado.idsReutilizados}\n` +
							`IDs novos: ${resultado.idsNovos}\n` +
							`Duplicatas: ${resultado.duplicatasProcessadas}`
						);

						// Pergunta se quer deletar o arquivo novo (clipado)
						// Por enquanto, apenas avisa
						new Notice(`Arquivo atualizado: ${arquivoExistente.basename}`, 5000);

					} catch (erro) {
						console.error('Erro ao atualizar legislação:', erro);
						new Notice('Erro ao atualizar. Verifique o console.');
					}
				}).open();
			}
		});

		console.log('Plugin Legislação Limpa carregado');
	}

	onunload() {
		console.log('Plugin Legislação Limpa descarregado');
	}
}
