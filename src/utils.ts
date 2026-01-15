/**
 * Gera um ID curto único baseado em caracteres alfanuméricos
 * @param length Tamanho do ID (padrão: 6)
 * @returns String alfanumérica única
 */
export function gerarIdCurto(length: number = 6): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Gera um ID único garantindo que não exista no conjunto fornecido
 * @param existentes Conjunto de IDs já utilizados
 * @param length Tamanho do ID
 * @returns ID único
 */
export function gerarIdUnico(existentes: Set<string>, length: number = 6): string {
	let id: string;
	do {
		id = gerarIdCurto(length);
	} while (existentes.has(id));
	existentes.add(id);
	return id;
}
