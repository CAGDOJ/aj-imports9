# AJ Imports — repositório de publicação

Este repositório é **somente a vitrine publicada** em https://ajimports.store/.
O **projeto principal, a gerência e as APIs** ficam no repositório privado `CAGDOJ/AJ-Imports`.

Não edite aqui páginas, fotos ou código da loja diretamente: isso causa versões divergentes. Os cadastros devem ser feitos pela gerência, e as alterações de código devem sair do projeto principal.

- O domínio oficial para os clientes é https://ajimports.store/.
- O endereço de entrada do gerente é https://ajimports.store/gerente/.
- O catálogo `catalogo.json` é atualizado a partir do banco de produtos pelo workflow `sync-catalog.yml`.
- O workflow de publicação preparado no projeto principal copia os arquivos estáticos para cá quando o token `AJIMPORTS_PAGES_TOKEN` estiver configurado.

**Não exclua este repositório por enquanto:** o domínio depende atualmente do GitHub Pages desta publicação. A migração definitiva para hospedagem full-stack deve manter o banco, as fotos e os pedidos intactos.
