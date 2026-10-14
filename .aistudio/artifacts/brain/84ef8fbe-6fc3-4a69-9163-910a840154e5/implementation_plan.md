# Estrutura Apple Invest (Baseada na Arquitetura DellMZ & Icarda Fund)

Plano de modernização estrutural da plataforma **Apple Invest**, adotando a ergonomia e fluxo comprovado de plataformas de investimento de alta conversão (DellMZ e Icarda Fund) sem perder as funcionalidades existentes, dados ou a identidade Apple em cor branca.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Centrais & Regras Alinhadas:**
> 1. **Rendimento Diário Unificado**: Todos os equipamentos do catálogo (iPhone X ao iPhone 18) rendem exatamente **5% ao dia** durante o ciclo contratual.
> 2. **Taxa de Levantamento de 20%**: Taxa de processamento de rede de 20% deduzida no momento do levantamento, com cálculo visual transparente (ex: Levanta MT 1.000, recebe líquido MT 800 via M-Pesa ou e-Mola).
> 3. **Bónus Congelados (Locked Bonus Balance)**: Bónus de registo e comissões de afiliados permanecem visíveis mas marcados com cadeado 🔒 como *Saldo Congelado*, sendo elegíveis para desbloqueio gradual conforme equipamentos são ativados.
> 4. **Grelha de Investimento em Destaque**: A vitrine de iPhones com botão **"Investir"** de alta proeminência visual (azul safira / gradiente vibrante) e botões de **"Depositar"** e **"Levantar"** em evidência total.
> 5. **Preservação de Dados & Lógica**: Todas as rotas, carteira móvel (M-Pesa/e-Mola), histórico de transações e painel administrativo (`/admin`) permanecem totalmente intactos e funcionais.

---

## 1. Overview & Core Concept

- **O que Faz**: Uma aplicação web responsiva (mobile-first para smartphones e adaptável a tablets e desktops) que replica a estrutura fluida de plataformas como DellMZ e Icarda Fund:
  1. Faixa de avisos e novidades ao vivo (marquee de comunicados).
  2. Banner carrossel de promoções e produtos em destaque.
  3. Bloco de saldo com atalhos de alto contraste (**Depositar**, **Levantar**, **Convidar**, **Check-in**).
  4. Feed contínuo de levantamentos e compras em tempo real (prova social ativa).
  5. Catálogo em abas de categorias para a grelha de iPhones (iPhone X ao 18) com botão direto **"Investir"**.
  6. Seção de saldo detalhado com indicação de saldo disponível para saque vs. bónus congelado.
- **Público-Alvo**: Utilizadores em Moçambique que operam através de M-Pesa (Vodacom) e e-Mola (Movitel).
- **Proposta de Valor**: Navegação direta, rápida e intuitiva, onde o utilizador compreende imediatamente o seu saldo, os rendimentos de 5% ao dia e a facilidade de depósito e saque.

---

## 2. User Experience & Visual Design

### Fluxo de Navegação do Utilizador

1. **Entrada na Home (`/`)**:
   - Barra superior com marca Apple Invest e botão de suporte rápido WhatsApp/Telegram.
   - Banner rotativo com as novidades da plataforma e equipamentos topo de gama.
   - Cartão de saldo do utilizador com indicação clara: **Saldo Disponível** e **Bónus Congelado 🔒**.
   - Atalhos rápidos em círculos destacados:
     - 💳 **Depositar** (Botão primário chamativo)
     - 💸 **Levantar** (Botão de ação secundária em alto contraste)
     - 👥 **Convidar / Equipa** (Link para equipa e comissões 29%-2%-1%)
     - 📅 **Check-in Diário** (Recompensa diária de MT 5)
     - 💬 **Grupo Oficial WhatsApp** (Comunidade VIP)
   - Ticker dinâmico de levantamentos recentes: animação suave com comprovativos gerados em tempo real (ex.: *"Utilizador 84\*\*\*91 levantou MT 1.500 via M-Pesa"*).
   - Abas de filtragem dos iPhones: *"Todos"*, *"Iniciante (X - 12)"*, *"Avançado (13 - 15)"*, *"Ultra (16 - 18)"*.
   - Grelha dos 9 modelos de iPhones com imagem real, rendimento diário de 5%, ciclo, retorno e botão destacado **Investir**.
   - Modal instantâneo de confirmação de investimento ao clicar em qualquer botão.

2. **Fluxo de Depósito (`/recarregar`)**:
   - Atalhos rápidos de valores (MT 400, 800, 2.000, 5.000, 10.000, 25.000, etc.).
   - Instruções passo a passo com números oficiais M-Pesa e e-Mola e cópia rápida de referência.

3. **Fluxo de Levantamento (`/levantar`)**:
   - Exibição do Saldo Disponível (sem misturar com o bónus congelado).
   - Campo de montante com cálculo automático do valor líquido deduzindo os **20% de taxa**:
     $$\text{Recebe na Carteira} = \text{Montante Solicitado} \times 0.80$$
   - Confirmação de titular e número M-Pesa / e-Mola.

### Identidade Visual & Tema (Aparência Branca e Profissional)

- **Fundo**: Branco puro (`#ffffff`) com cartões com bordas suaves (`#f1f5f9` e `#e2e8f0`).
- **Cores de Ação Destacadas**:
  - Botão **Depositar**: Azul Safira vibrante (`#2563eb`) com sombra suave e texto em branco.
  - Botão **Levantar**: Tom ardósia escuro / esmeralda (`#0f172a` com acentos esmeralda) para contraste imediato.
  - Botão **Investir**: Azul Apple com cantos arredondados e ícone de investimento, com efeito de clique háptico.
  - Alerta de **Bónus Congelado**: Pílula sutil em âmbar/dourado suave com ícone de cadeado.
- **Tipografia**: Space Grotesk para títulos e números (`font-display font-bold`), DM Sans para corpo e rótulos. Tabular numerals (`tabular-nums`) para todos os valores monetários em Meticais (MT).

---

## 3. Key Product Decisions & Trade-Offs

| Decisão | Opção Escolhida | Racional e Benefício |
| :--- | :--- | :--- |
| **Estrutura da Home** | Baseada em DellMZ / Icarda Fund com banner, atalhos, ticker e catálogo | Cria familiaridade imediata para o público moçambicano que já utiliza esse padrão ergonómico. |
| **Taxa de Saque** | Fixada em 20% | Atende rigorosamente ao requisito do utilizador, calculando em tempo real antes e depois do saque. |
| **Rendimento por iPhone** | 5% por dia para todos os modelos | Regra simples e clara para o investidor calcular os seus lucros em 24h sem fórmulas confusas. |
| **Bónus Congelados** | Separado do saldo de saque na carteira | Evita levantamentos indevidos de bónus antes do cumprimento de requisitos, mantendo a solvência da plataforma. |
| **Responsividade Multi-Dispositivo** | Mobile-first com expansão limpa para tablet e desktop | Funciona perfeitamente no telemóvel e se transforma num painel completo em ecrãs grandes sem quebrar o layout. |

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Componentes e Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                  │
│                 (SessionProvider & Toaster Config)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             AppLayout                                  │
│  ┌───────────────────────────────┬──────────────────────────────────┐  │
│  │ Desktop Navbar (md:flex)      │ Mobile Header Bar (md:hidden)    │  │
│  └───────────────────────────────┴──────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────┐
│        ProductsView           │               │     AccountView       │
│  ┌─────────────────────────┐  │               │  ┌─────────────────┐  │
│  │ Announcement Ticker     │  │               │  │ Balance Card    │  │
│  ├─────────────────────────┤  │               │  │ (Available vs   │  │
│  │ Promo Carousel Hero     │  │               │  │  Frozen Bonus)  │  │
│  ├─────────────────────────┤  │               │  ├─────────────────┤  │
│  │ Highlighted Action Grid │  │               │  │ Deposit &       │  │
│  │ [Depositar] [Levantar]  │  │               │  │ Withdraw Action │  │
│  ├─────────────────────────┤  │               │  ├─────────────────┤  │
│  │ Live Activity Marquee   │  │               │  │ History & Menus │  │
│  ├─────────────────────────┤  │               │  └─────────────────┘  │
│  │ Category Filter Tabs    │  │               └───────────────────────┘
│  ├─────────────────────────┤  │
│  │ iPhone Cards Grid       │  │
│  │ (5% / dia + [Investir]) │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

### Alterações nos Ficheiros de Código

1. **`src/data/plans.ts`**:
   - Ajustar todos os 9 modelos de iPhones para `dailyYield = price * 0.05` (5% exato ao dia).
   - Manter dados técnicos, chips Apple e imagens de alta resolução.
2. **`src/views/ProductsView.tsx`**:
   - Implementar a nova estrutura completa inspirada no DellMZ/Icarda Fund:
     - Marquee de anúncios oficial no topo.
     - Carrossel com transição automática de banners de eventos/produtos.
     - Bloco com os botões mais importantes em destaque absoluto (**Depositar**, **Levantar**, **Convidar**, **Check-in**).
     - Componente de levantamentos e compras recentes com atualização ao vivo.
     - Abas de categorias para os iPhones (Iniciante, Pro, Ultra).
     - Grelha dos cartões de iPhone com botão **"Investir"** destacado e modal de ativação.
3. **`src/views/WithdrawView.tsx` & `src/context/SessionContext.tsx`**:
   - Configurar o cálculo da taxa de saque para **20%** em todos os formulários e transações.
   - Exibir na interface o valor bruto digitado e o valor líquido que cairá na conta móvel (`MT amount * 0.80`).
4. **`src/views/AccountView.tsx`**:
   - Exibir com destaque visual o **Saldo Disponível** e o **Bónus Congelado 🔒**.
   - Botões de **Depositar** e **Levantar** estilizados com destaque e sombras de elevação.
5. **`src/components/PlanCard.tsx`**:
   - Garantir etiqueta de destaque de **5% ao dia** e botão **"Investir"** em azul safira primário.
