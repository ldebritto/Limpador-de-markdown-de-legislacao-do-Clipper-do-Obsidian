/**
 * Atualizador de legislação
 *
 * Permite atualizar uma legislação já processada com uma nova versão,
 * preservando IDs de deeplinks existentes.
 */

import { TabelasProtegidas } from './types';
import { processarFrontmatter } from './frontmatter';
import { removerBrasao } from './brasao';
import { protegerTabelas, restaurarTabelas } from './tabelas';
import { converterHierarquia } from './hierarquia';
import { adicionarDeeplinks } from './deeplinks';
import { normalizarArtigos } from './artigos';
import { normalizarTextoClipado } from './normalizacao';
import { processarDuplicatas } from './duplicatas';
import { extrairIds, MapaIds } from './extrator-ids';

/**
 * Resultado da atualização
 */
export interface ResultadoAtualizacao {
	conteudo: string;
	idsReutilizados: number;
	idsNovos: number;
	duplicatasProcessadas: number;
}

/**
 * Atualiza uma legislação existente com uma nova versão clipada
 *
 * @param conteudoExistente Conteúdo do arquivo já processado (com IDs)
 * @param conteudoNovo Conteúdo recém-clipado (sem IDs)
 * @returns Conteúdo atualizado com IDs preservados
 */
export function atualizarLegislacao(
	conteudoExistente: string,
	conteudoNovo: string
): ResultadoAtualizacao {
	// 1. Extrai IDs do documento existente
	const idsExistentes = extrairIds(conteudoExistente);
	const totalIdsExistentes = idsExistentes.size;

	// 2. Processa o documento novo
	let resultado = conteudoNovo;
	const tabelasProtegidas: TabelasProtegidas = {};
	const idsUtilizados = new Set<string>();

	// Etapa 0: Normalizar texto clipado (corrigir Art**.** etc)
	resultado = normalizarTextoClipado(resultado);

	// Etapa 0.5: Processar duplicatas (versões originais → callout)
	const antesDeProcessarDuplicatas = resultado;
	resultado = processarDuplicatas(resultado);
	const duplicatasProcessadas = (antesDeProcessarDuplicatas.match(/\(Redação dada pela/g) || []).length;

	// Etapa 1: Remover brasão
	resultado = removerBrasao(resultado);

	// Etapa 2: Proteger tabelas
	const resultadoTabelas = protegerTabelas(resultado, idsUtilizados);
	resultado = resultadoTabelas.conteudo;
	Object.assign(tabelasProtegidas, resultadoTabelas.tabelas);

	// Etapa 3: Processar frontmatter
	// Preservar aliases manuais do documento existente
	resultado = mesclarFrontmatters(conteudoExistente, resultado);

	// Etapa 4: Converter hierarquia
	resultado = converterHierarquia(resultado);

	// Etapa 5: Normalizar artigos
	resultado = normalizarArtigos(resultado);

	// Etapa 6: Adicionar IDs (reutilizando existentes)
	resultado = adicionarDeeplinks(resultado, idsUtilizados, idsExistentes);

	// Etapa final: Restaurar tabelas
	resultado = restaurarTabelas(resultado, tabelasProtegidas);

	// Calcula estatísticas
	const idsReutilizados = contarIdsReutilizados(resultado, idsExistentes);
	const idsNovos = idsUtilizados.size - idsReutilizados;

	return {
		conteudo: resultado,
		idsReutilizados,
		idsNovos,
		duplicatasProcessadas,
	};
}

/**
 * Mescla frontmatters preservando campos do existente
 */
function mesclarFrontmatters(existente: string, novo: string): string {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---/;

	const matchExistente = existente.match(frontmatterRegex);
	const matchNovo = novo.match(frontmatterRegex);

	if (!matchExistente || !matchNovo) {
		return processarFrontmatter(novo);
	}

	// Extrai aliases manuais do existente
	const aliasesExistentes = extrairAliasesManuais(matchExistente[1]);

	// Processa o novo frontmatter
	let resultado = processarFrontmatter(novo);

	// Adiciona aliases manuais do existente
	if (aliasesExistentes.length > 0) {
		const novoMatch = resultado.match(frontmatterRegex);
		if (novoMatch) {
			let frontmatter = novoMatch[1];

			// Encontra o bloco de aliases e adiciona os manuais
			frontmatter = frontmatter.replace(
				/(aliases:\n(?:\s+-\s*"[^"]+"\n)*)/,
				(match) => {
					const linhasExtras = aliasesExistentes
						.filter(a => !match.includes(a))
						.map(a => `  - "${a}"`)
						.join('\n');
					// Garante que há quebra de linha antes das linhas extras
					const matchComNewline = match.endsWith('\n') ? match : match + '\n';
					return linhasExtras ? `${matchComNewline}${linhasExtras}\n` : match;
				}
			);

			resultado = resultado.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
		}
	}

	return resultado;
}

/**
 * Extrai aliases que não são gerados automaticamente (manuais)
 */
function extrairAliasesManuais(frontmatter: string): string[] {
	const aliases: string[] = [];
	const linhas = frontmatter.split('\n');
	let dentroDeAliases = false;

	// Padrão de aliases gerados automaticamente
	const PADROES_AUTOMATICOS = [
		/^(Lei Complementar|LC|Lei|L|Decreto|D|Medida Provisória|MP|Emenda Constitucional|EC)\s*(nº\s*)?\d+/i,
	];

	for (const linha of linhas) {
		if (/^aliases:/.test(linha)) {
			dentroDeAliases = true;
			continue;
		}

		if (dentroDeAliases) {
			if (/^\s+-/.test(linha)) {
				const match = linha.match(/^\s+-\s*["']?([^"'\n]+)["']?/);
				if (match) {
					const alias = match[1].trim();
					// Verifica se é um alias manual (não automático)
					const ehAutomatico = PADROES_AUTOMATICOS.some(p => p.test(alias));
					if (!ehAutomatico) {
						aliases.push(alias);
					}
				}
			} else if (!/^\s/.test(linha)) {
				dentroDeAliases = false;
			}
		}
	}

	return aliases;
}

/**
 * Conta quantos IDs foram reutilizados
 */
function contarIdsReutilizados(conteudo: string, idsExistentes: MapaIds): number {
	let count = 0;
	for (const id of idsExistentes.values()) {
		if (conteudo.includes(`^${id}`)) {
			count++;
		}
	}
	return count;
}
