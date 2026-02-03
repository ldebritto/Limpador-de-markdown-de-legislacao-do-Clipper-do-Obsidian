# Atualizador de legislação

## Workflow pretendido

1. Usuário faz clip a partir do Obsidian Clipper da lei atualizada a partir do site do Planalto
2. Usuário abre o novo arquivo no Obsidian e acessa a funcionalidade "Atualizar legislação", indicando o arquivo pré-existente da legislação dentro do vault
3. O plugin duplica arquivo pré-existente para criar um backup, renomeando-o com "backup" para facilitar a identificação posterior
4. Plugin verifica mudanças, escreve os uuids novos necessários e dá saída a um arquivo consolidado, sobrescrevendo o arquivo da pré-existente da legislação para preservar os links já feitos a partir de outras notas

## Especificações para o funcionamento do mecanismo atualizador

1. Os links anteriormente feitos a partir de outras notas devem apontar para as mesmas redações que antes apontavam o arquivo pré-existente, sendo, portanto, crucial que o arquivo consolidado tenha o mesmo título do arquivo pré-existente
2. Toda redação modificada ou revogada deve ser preservada, mas colocada dentro de um *foldable callout* (`> [!quote]-`), preservando seu uuid e, assim, mantendo íntegros os links criados em outras notas para ele
3. Deve ser gerado um novo uuid para as redações novas, permitindo a criação de novos links para essas seções. As novas redações devem ficar _fora_ dos callouts, dadndo preferência em termos visuais ao texto vigente em detrimento do texto revogado.
4. Na dúvida, considere que o texto está vigente e deixe-o fora do callout. O usuário pode, manualmente, inseri-lo ou retirá-lo do callout.

