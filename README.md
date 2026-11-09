# 🚀 SpotQR Pro — Gerador de QR Code Dinâmico com Logomarca & Cardápio Digital

> **Negócio Digital de Altíssima Margem & Custo Operacional R$ 0,00**  
> Focado em restaurantes, bares, cafeterias, barbearias, clínicas e comércios locais em todo o Brasil.

---

## 💡 A Tese de Negócio & Psicologia Financeira

### 1. O Problema Doloroso do Dono de Restaurante:
- Todo comércio físico gasta de **R$ 150 a R$ 450** imprimindo displays de acrílico e adesivos vinílicos para as mesas e balcões com QR Codes comuns.
- Quando o estabelecimento **muda o número de WhatsApp, altera os preços do cardápio ou adiciona uma nova promoção**, o QR Code estático antigo quebra ou aponta para um link obsoleto.
- **Resultado:** O dono joga R$ 300 no lixo e fica dias esperando a gráfica reimprimir novas plaquinhas.

### 2. A Oferta Irrecusável (No-Brainer Offer):
- **Versão Gratuita (A Isca Perfeita de Tráfego)**:
  - Criação ilimitada de QR Codes estáticos com logotipo no centro, cores personalizadas, molduras com texto chamativo (*"ESCANEIE AQUI"*, *"CARDÁPIO NA MESA"*, *"PAGUE COM PIX"*) e download em alta resolução (300 DPI) para gráficas.
  - Gera QR Code PIX oficial no padrão BRCode do Banco Central (sem taxas de banco para o lojista).
- **Versão PRO (R$ 10,90 - Cobrança Única via Mercado Pago Pix)**:
  - **QR Code Dinâmico Inteligente (`/r/slug`)**: O restaurante imprime o adesivo hoje. Daqui a 6 meses, se trocar o cardápio ou o link, basta alterar o destino no painel em 1 segundo. O adesivo físico continua funcionando para sempre.
  - **Cardápio Digital Mobile-First**: Sem depender do iFood (que cobra até 27% de comissão por pedido). O cliente adiciona itens no carrinho e envia a comanda pronta no WhatsApp do estabelecimento.
  - **Gerador de Display de Mesa A6/A5**: Formatação automática de folha A4 pronta para imprimir com corte e vinco para suportes de mesa em acrílico.
  - **Métricas de Acessos**: Visualização em tempo real de quantos clientes escanearam a mesa.

---

## 🛠️ Arquitetura Técnica & Custo Zero

| Camada | Tecnologia | Custo Operacional |
| :--- | :--- | :--- |
| **Frontend & Backend** | Next.js 14 (App Router) + React 18 + TypeScript | **R$ 0,00** |
| **Estilização** | Tailwind CSS + Lucide Icons + Glassmorphism | **R$ 0,00** |
| **Hospedagem** | Vercel / Netlify / Cloudflare Pages (Free Tier Generoso) | **R$ 0,00** |
| **Renderização QR** | HTML5 Canvas + SVG no navegador do cliente (zero carga de CPU no servidor) | **R$ 0,00** |
| **Banco de Dados** | SQLite / JSON Adapter thread-safe (pronto para Turso/Supabase 100% free) | **R$ 0,00** |
| **Gateway de Pagamento** | **Mercado Pago API** (Pix Imediato + Webhook com liberação instantânea) | **0% mensalidade** (Apenas taxa padrão do Pix) |

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

## 💳 Configuração do Mercado Pago

O sistema possui **Modo Híbrido Inteligente**:
- **Sem credenciais**: Funciona em **Modo Demonstração Interativo**, permitindo testar o fluxo de ponta a ponta com o botão *"⚡ Simular Aprovação Agora"*.
- **Com credenciais reais**:
  1. Acesse o painel de desenvolvedores do Mercado Pago: [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)
  2. Crie uma aplicação e copie o **Access Token de Produção** (`APP_USR-...`).
  3. Cole no seu arquivo `.env.local` ou nas variáveis de ambiente da Vercel:
     ```env
     MP_ACCESS_TOKEN=APP_USR-seu-token-aqui
     NEXT_PUBLIC_BASE_URL=https://seudominio.com.br
     ```
  4. Pronto! O dinheiro das ativações de R$ 10,90 cai direto na sua conta do Mercado Pago via Pix instantâneo.

---

## 🌐 Rotas da Aplicação

- `/`: Estúdio de Geração de QR Code, Live Preview, Calculadora de Economia e Tabela de Preços.
- `/cardapio/[slug]`: Página pública do Cardápio Digital (ex: `/cardapio/demo-restaurante`).
- `/r/[slug]`: Redirecionador Dinâmico com contabilização de scans em tempo real.
- `/dashboard`: Painel do cliente para gerenciar destinos, ver leituras e editar o cardápio.
- `/api/mercadopago/create-pix`: Endpoint de geração de cobrança Pix oficial.
- `/api/mercadopago/check-status`: Polling de verificação de status do Pix.
- `/api/mercadopago/webhook`: Webhook para recebimento assíncrono de notificações do Mercado Pago.

