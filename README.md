# 🚀 SpotQR Pro — Catálogos Digitais, Cardápios & QR Codes Dinâmicos

> **Plataforma SaaS completa para Lojas, Ateliês, Restaurantes, Bares, Cafeterias, Barbearias e Comércios Locais**  
> Com **Preço PRO Editável em Tempo Real** no Painel Admin (`/admin`), pedidos via WhatsApp sem comissão, PIX oficial do Banco Central e persistência em nuvem via Redis/Vercel KV.

---

## 💡 Proposta de Valor & Planos

### 1. O Problema Real do Comércio Local:
- Estabelecimentos gastam de **R$ 150 a R$ 450** imprimindo displays de acrílico e adesivos com QR Codes comuns.
- Quando mudam o número de WhatsApp, ajustam preços ou criam promoções, o QR Code estático antigo deixa de funcionar ou exige reimpressão cara.
- Apps de marketplace cobram até **27% de comissão** por pedido, reduzindo drasticamente a margem do lojista.

### 2. Planos da Plataforma:
- **Versão Gratuita**:
  - Criação ilimitada de QR Codes estáticos (sem logomarca central), cores personalizadas, molduras com CTA (*"ESCANEIE AQUI"*, *"CARDÁPIO NA MESA"*, *"PAGUE COM PIX"*) e download em alta resolução.
  - Geração de QR Code PIX oficial no padrão BRCode do Banco Central (0% de taxa de intermediação).
  - Catálogo Digital e Cardápio Digital com exibição de anúncios patrocinados.
- **Plano PRO (Valor vigente configurável no `/admin` — atualmente R$ 25,90/mês via PIX ou Cartão Recorrente Mercado Pago)**:
  > 💡 **Preço Dinâmico:** O valor exibido na página inicial, painel do cliente, checkout, Termos de Uso e relatórios financeiros acompanha **automaticamente** o preço configurado no Painel do Desenvolvedor (`/admin`), sem precisar alterar código.
  - **Logomarca no Centro do QR Code**: Suporte à logo do cliente em todas as modalidades de QR Code (Catálogo, Cardápio, PIX, WhatsApp, Instagram, Site, Wi-Fi, vCard, Google Avaliações).
  - **QR Code Dinâmico Inteligente (`/r/slug`) & Link Amigável (`/catalogo/sua-loja` ou `/cardapio/sua-loja`)**: O destino pode ser alterado a qualquer momento sem reimprimir adesivos ou plaquinhas.
  - **100% Sem Anúncios**: Remove todos os banners e também o botão de retorno *"Criador de QR"* na vitrine do assinante PRO.
  - **Galeria Multi-Fotos por Produto**: Até **5 fotos/ângulos diferentes** por produto com recorte/enquadramento individual e lightbox interativo com miniaturas e zoom.
  - **Banner em Vídeo Curto Animado no Topo**: Vídeos em loop contínuo (MP4 H.264 / WebM), otimizados inclusive para Safari iOS/macOS sem pausa nem botão de play nativo, além de vídeos prontos por segmento (Churrascaria, Cervejaria Artesanal, Restaurante, Ateliê, Artesanato e Boutique).
  - **Gerador de Display de Mesa A6/A5 & Download Instantâneo em PNG 1200px**.
  - **Métricas de Scans em Tempo Real**.

---

## ✨ Recursos da Vitrine Digital (Catálogo & Cardápio)

- **Pedidos Direto no WhatsApp (0% de comissão)**: Suporte a *Na Mesa / Presencial*, *Entrega / Delivery* e *Retirar na Loja / Balcão*.
- **Pagamento Flexível**: PIX com valor exato travado no carrinho (exibido apenas quando o cliente escolhe PIX), Cartão de Crédito/Débito, Link de Pagamento e **Dinheiro com aviso de troco** (cálculo automático do troco na Entrega e Retirada).
- **Controle de Estoque Anti-Venda Dupla**: Produtos com quantidade limitada ou *Peça Única* reduzem o estoque automaticamente ao fechar o pedido; o anunciante confirma a venda ou cancela para devolver o estoque e reativar o anúncio no ar.
- **Prazo de Produção (*Sob Encomenda*)**: Exibe claramente no catálogo e no pedido o tempo configurado em dias para confecção da peça.
- **Gestão Ágil no Editor**: Criação de novas categorias diretamente dentro do card do produto (sem trocar de aba), reordenação por arrastar-e-soltar, tema Claro/Escuro e cor de destaque personalizada.

---

## 🛡️ Segurança & Painel do Desenvolvedor (`/admin`)

- **Recuperação Segura de Senha**: Código de backup offline pessoal do anunciante + fluxo de verificação manual pelo WhatsApp oficial cadastrado (código único de 30 min gerado no `/admin`).
- **Proteção Anti-Golpe PIX**: Alteração de Chave PIX exige confirmação de senha e entra em quarentena automática de 24h após recuperação de senha (com trava/liberação manual no `/admin`).
- **Gestão Completa de Contas**: Suspender, reativar ou **deletar contas definitivamente** (removendo usuário, lojas, QR Codes, pedidos e sessões ativas tanto localmente quanto no Redis).
- **Vouchers PRO Impressos & Liberação Presencial**: Geração de códigos promocionais com validade em dias/horas ou acesso indeterminado.
- **Edição de Preço PRO em Tempo Real**: Ajuste do valor da assinatura direto nas configurações do `/admin`, refletindo imediatamente em todo o site e nas cobranças do Mercado Pago.

---

## 🛠️ Arquitetura Técnica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend & Backend** | Next.js 14 (App Router) + React 18 + TypeScript |
| **Estilização** | Tailwind CSS + Lucide Icons |
| **Hospedagem** | Vercel (Serverless + Edge CDN) |
| **Renderização QR** | HTML5 Canvas no navegador com leitura óptica validada |
| **Persistência** | Upstash Redis / Vercel KV REST API + fallback local JSON (`data/database.json`) |
| **Pagamentos** | **Mercado Pago API** (PIX Imediato + Cartão Recorrente + Webhook de aprovação) |

---

## ⚡ Como Rodar o Projeto Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Rodar em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

3. **Compilar para produção**:
   ```bash
   npm run build
   npm start
   ```

---

## 💳 Configuração de Produção (Vercel & Mercado Pago)

1. Configure suas credenciais do Mercado Pago e do banco Redis/KV nas variáveis de ambiente da Vercel (ou em `.env.local` para testes locais):
   ```env
   MP_ACCESS_TOKEN=APP_USR-seu-token-aqui
   NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-sua-chave-publica
   NEXT_PUBLIC_BASE_URL=https://www.spotqr.com.br
   KV_REST_API_URL=https://sua-instancia.upstash.io
   KV_REST_API_TOKEN=seu-token-redis
   ```
2. O **valor da assinatura PRO** pode ser ajustado a qualquer momento diretamente em **`/admin` → Configurações → Valor da Assinatura PRO (R$)** (atualmente configurado em **R$ 25,90**). Todas as novas cobranças via PIX, Cartão Recorrente, páginas de vendas e Termos de Uso passam a usar o novo valor imediatamente.

---

## 🌐 Principais Rotas da Aplicação

- `/`: Gerador de QR Code com Preview em Tempo Real, comparativo Gratuito vs PRO e demos públicas.
- `/catalogo/[slug]` e `/cardapio/[slug]`: Vitrines públicas (modelos demo: `/catalogo/demo-catalogo` e `/cardapio/demo-restaurante`).
- `/r/[slug]`: Redirecionador dinâmico com contagem de scans.
- `/login`: Portal de autenticação, cadastro e recuperação segura de senha do cliente.
- `/dashboard`: Painel do anunciante para editar catálogo/cardápio, pedidos/estoque, link amigável, segurança e assinatura PRO.
- `/admin`: Painel restrito do desenvolvedor (faturamento, lojas, vouchers, segurança/contas e edição do preço PRO).
- `/termos` e `/privacidade`: Termos de Uso (com preço PRO dinâmico) e Política de Privacidade (LGPD).
- `/api/pro-price`: Endpoint público em tempo real com o valor vigente do Plano PRO.
- `/api/mercadopago/*` e `/api/subscription/card`: Fluxos de pagamento PIX, Cartão Recorrente e Webhook Mercado Pago.
