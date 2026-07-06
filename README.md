# 🏢 EspaçoJá Real

> Plataforma digital para gestão e agendamento de espaços para eventos, casas e apartamentos.

**Trabalho Final — Banco de Dados I (DEC7129 — 2026.1)**  
**Universidade Federal de Santa Catarina — Campus Araranguá**  
**Professor:** Alexandre Leopoldo Gonçalves  
**Integrantes:** Lucas Teixeira Belli e Ludivino José da Silva

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Banco de Dados](#banco-de-dados)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Usar](#como-usar)
- [Integração com IA Generativa](#integração-com-ia-generativa)
- [Consultas SQL](#consultas-sql)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## 📌 Sobre o Projeto

O **EspaçoJá Real** é uma plataforma web completa que conecta proprietários de espaços (salões de festas, quadras esportivas, auditórios, apartamentos, casas e espaços de coworking) a locatários interessados em alugá-los por período determinado.

O sistema automatiza todo o ciclo da locação:
- Cadastro e gestão de espaços com imagens
- Busca por nome, cidade, tipo ou comodidades
- Reservas com verificação automática de conflitos de horário
- Desconto de 10% para reservas feitas com 20 ou mais dias de antecedência
- Multa por cancelamento com menos de 5 dias de antecedência (variável por categoria)
- Geração automática de nota fiscal e fluxo de pagamento com confirmação do proprietário
- Avaliações bidirecionais: locatário avalia o espaço e proprietário avalia o locatário
- Integração com IA Generativa para sugestão de preço competitivo

---

## ✅ Funcionalidades

### Para Proprietários
- Cadastrar, editar e excluir espaços
- Definir tipo, preço por hora, comodidades e imagem
- Confirmar, finalizar ou cancelar reservas solicitadas
- Visualizar status de pagamento (pago / aguardando / a confirmar)
- Confirmar recebimento de pagamentos e multas
- Avaliar locatários após reservas finalizadas
- Receber sugestão de preço competitivo via IA Generativa

### Para Locatários
- Buscar e filtrar espaços disponíveis
- Visualizar política de desconto e multa antes de reservar
- Solicitar reservas com cálculo automático de valor e desconto
- Cancelar reservas (com aviso de multa quando aplicável)
- Pagar via PIX, cartão, boleto ou transferência
- Avaliar espaços após reservas finalizadas

### Para Ambos
- Autenticação segura com JWT
- Dashboard personalizado por tipo de utilizador
- Consultas analíticas com gráficos em tempo real
- Navegação por navbar condicional (menus diferentes por perfil)

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| **Node.js** | 18+ | Ambiente de execução JavaScript |
| **Express.js** | 4.x | Framework para API REST |
| **Sequelize** | 6.x | ORM para mapeamento objeto-relacional |
| **MySQL** | 8.x | Sistema Gerenciador de Banco de Dados |
| **bcryptjs** | 2.x | Hash seguro de senhas |
| **jsonwebtoken** | 9.x | Autenticação via tokens JWT |
| **multer** | 1.x | Upload de imagens (multipart/form-data) |
| **dotenv** | 16.x | Gestão de variáveis de ambiente |
| **groq-sdk** | latest | Integração com API da Groq (LLM) |
| **cors** | 2.x | Controle de Cross-Origin Resource Sharing |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| **Next.js** | 16.x | Framework React com App Router |
| **React** | 18.x | Biblioteca para interfaces de utilizador |
| **Tailwind CSS** | 3.x | Framework CSS utilitário |
| **Recharts** | 2.x | Gráficos interativos para as consultas SQL |

### Banco de Dados e Ferramentas
| Ferramenta | Função |
|---|---|
| **MySQL Workbench** | Administração visual do banco de dados |
| **MySQL 8** | SGBD relacional com suporte a ENUM, FK e CHECK |
| **Sequelize ORM** | Mapeamento de modelos JS para tabelas SQL |

### IA Generativa
| Serviço | Modelo | Função |
|---|---|---|
| **Groq API** | LLaMA 3.3 70B Versatile | Sugestão de preço competitivo para proprietários |

### Controle de Versão
| Ferramenta | Função |
|---|---|
| **Git** | Versionamento do código |
| **GitHub** | Repositório remoto e histórico de commits |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Next.js)              │
│         http://localhost:3000                │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │Dashboard │ │Reservas  │ │Consultas SQL│  │
│  │ + Busca  │ │Pagamentos│ │  + Gráficos │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ HTTP (fetch / REST API)
┌─────────────────▼───────────────────────────┐
│           BACKEND (Node.js + Express)        │
│          http://localhost:8000               │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │   Auth   │ │  CRUD    │ │  Consultas  │  │
│  │  JWT     │ │Sequelize │ │    SQL      │  │
│  └──────────┘ └────┬─────┘ └─────────────┘  │
│                    │                         │
│  ┌─────────────────▼──────────────────────┐  │
│  │         Groq API (LLaMA 3.3 70B)       │  │
│  │    Sugestão de preço competitivo       │  │
│  └────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ Sequelize ORM
┌─────────────────▼───────────────────────────┐
│              MySQL 8 (SGBD)                  │
│         13 tabelas relacionais               │
│  usuario, proprietario, locatario,           │
│  pessoa_fisica, pessoa_juridica,             │
│  tipo_espaco, espaco, imagem_espaco,         │
│  reserva, avaliacao, nota,                   │
│  pagamento, forma_pagamento                  │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Banco de Dados

### Modelo de Dados — 13 Tabelas

| Tabela | Descrição |
|---|---|
| `usuario` | Superentidade com herança para proprietário e locatário |
| `proprietario` | Especialização de usuario (herança) |
| `locatario` | Especialização de usuario (herança) |
| `pessoa_fisica` | Especialização de locatario com CPF |
| `pessoa_juridica` | Especialização de locatario com CNPJ |
| `tipo_espaco` | Categorias de espaço com percentual de multa |
| `espaco` | Imóveis cadastrados com valor por hora |
| `imagem_espaco` | Galeria de imagens dos espaços |
| `reserva` | Reservas com desconto e multa calculados |
| `avaliacao` | Avaliações bidirecionais vinculadas à reserva |
| `nota` | Nota fiscal gerada por reserva finalizada ou cancelada com multa |
| `pagamento` | Pagamentos com confirmação do proprietário |
| `forma_pagamento` | PIX, cartão, boleto, transferência |

### Regras de Negócio no Banco
- **Conflito de horário**: verificado via query antes de criar reserva
- **Desconto**: 10% aplicado automaticamente para reservas com ≥ 20 dias de antecedência
- **Multa por cancelamento**: percentual variável por `tipo_espaco` (5% a 15%), aplicado quando cancelamento ocorre com ≤ 5 dias de antecedência
- **Avaliação única por reserva**: controlada pelo campo `id_reserva` + `tipo_avaliacao` na tabela `avaliacao`
- **Pagamento com confirmação**: status inicia em `PENDENTE`, proprietário confirma mudando para `APROVADO`

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MySQL 8+
- npm ou yarn

### 1. Clonar o repositório
```bash
git clone https://github.com/ludivinojosedasilva/ESPACOJA.git
cd ESPACOJA
```

### 2. Configurar o banco de dados
Abra o MySQL Workbench e execute em ordem:
```
1. database_ddl_final.sql   → cria o banco e as 13 tabelas
2. seed_data_v3.sql         → insere dados de exemplo
```

### 3. Configurar o Backend
```bash
cd backend
npm install
```

Crie o arquivo `.env` na pasta `backend/`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=espacoja
DB_PORT=3306
JWT_SECRET=seu_segredo_jwt
PORT=8000
GROQ_API_KEY=sua_chave_groq
```

Inicie o servidor:
```bash
npm start
```

### 4. Configurar o Frontend
```bash
cd frontend
npm install
```

Crie o arquivo `.env.local` na pasta `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Inicie o frontend:
```bash
npm run dev
```

### 5. Acessar a aplicação
```
http://localhost:3000
```

---

## 🚀 Como Usar

### Contas de Teste (após rodar o seed)
> Senha de todos os utilizadores: `senha123`

| Email | Tipo | Nome |
|---|---|---|
| `carlos@email.com` | Proprietário | Carlos Mendes |
| `ana@email.com` | Proprietário | Ana Souza |
| `roberto@email.com` | Proprietário | Roberto Lima |
| `fernanda@email.com` | Locatário | Fernanda Costa |
| `joao@email.com` | Locatário | João Pereira |
| `mariana@email.com` | Locatário | Mariana Alves |

### Fluxo Principal
```
1. Registo/Login
2. Proprietário cadastra espaço → define tipo, preço e comodidades
3. Locatário busca espaço → filtra por nome, cidade ou tipo
4. Locatário faz reserva → sistema verifica conflito e aplica desconto se elegível
5. Proprietário confirma reserva → status muda para CONFIRMADA
6. Proprietário finaliza reserva → status muda para FINALIZADA
7. Nota fiscal é gerada automaticamente
8. Locatário paga → escolhe forma de pagamento
9. Proprietário confirma recebimento → pagamento aprovado
10. Ambos avaliam (locatário avalia espaço / proprietário avalia locatário)
```

---

## 🤖 Integração com IA Generativa

O sistema integra a **API da Groq** com o modelo **LLaMA 3.3 70B Versatile** para sugerir preços competitivos aos proprietários.

### Como funciona
1. Proprietário acede a `/ia` no sistema
2. Informa nome, tipo, localização e comodidades do espaço
3. O backend busca 5 espaços similares do banco de dados como contexto
4. Envia o prompt para a API da Groq
5. A IA retorna:
   - Preço sugerido por hora
   - Faixa de preço (mínimo e máximo)
   - Justificativa baseada nos dados do mercado
   - Dicas para aumentar o valor do espaço

### Rota da API
```
POST /ia/sugerir-preco
Body: { nome, tipo, endereco, comodidades, descricao }
```

---

## 📊 Consultas SQL

O sistema disponibiliza 3 consultas SQL com funções de agregação, acessíveis em `/consultas`:

### Consulta 1 — Receita por Tipo de Espaço
```sql
SELECT te.nome AS tipo_espaco,
       COUNT(p.id_pagamento) AS total_pagamentos,
       SUM(p.valor_pagamento) AS total_arrecadado
FROM tipo_espaco te
JOIN espaco e ON e.id_tipo = te.id_tipo
JOIN reserva r ON r.id_espaco = e.id_espaco
JOIN nota n ON n.id_reserva = r.id_reserva
JOIN pagamento p ON p.id_nota = n.id_nota
WHERE p.status = 'APROVADO'
GROUP BY te.id_tipo, te.nome
ORDER BY total_arrecadado DESC;
```

### Consulta 2 — Média de Avaliações por Espaço
```sql
SELECT e.nome AS espaco, u.nome AS proprietario,
       COUNT(a.id_avaliacao) AS total_avaliacoes,
       ROUND(AVG(a.nota), 2) AS media_nota
FROM espaco e
JOIN usuario u ON u.id_usuario = e.id_proprietario
JOIN avaliacao a ON a.id_espaco = e.id_espaco
WHERE a.tipo_avaliacao = 'LOCATARIO_AVALIA_ESPACO'
GROUP BY e.id_espaco, e.nome, u.nome
HAVING COUNT(a.id_avaliacao) >= 1
ORDER BY media_nota DESC;
```

### Consulta 3 — Volume de Reservas por Mês
```sql
SELECT DATE_FORMAT(r.data_hora_inicio, '%m/%Y') AS mes_ano,
       COUNT(r.id_reserva) AS total_reservas,
       SUM(r.valor_total) AS valor_movimentado
FROM reserva r
JOIN espaco e ON e.id_espaco = r.id_espaco
JOIN tipo_espaco te ON te.id_tipo = e.id_tipo
WHERE r.status IN ('CONFIRMADA', 'FINALIZADA')
GROUP BY DATE_FORMAT(r.data_hora_inicio, '%m/%Y'),
         YEAR(r.data_hora_inicio), MONTH(r.data_hora_inicio)
ORDER BY YEAR(r.data_hora_inicio), MONTH(r.data_hora_inicio);
```

---

## 📁 Estrutura de Pastas

```
ESPACOJA/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuração Sequelize + MySQL
│   ├── models/
│   │   ├── User.js              # Modelo usuario
│   │   ├── Space.js             # Modelo espaco
│   │   ├── Reservation.js       # Modelo reserva
│   │   ├── TipoEspaco.js        # Modelo tipo_espaco
│   │   ├── FormaPagamento.js    # Modelo forma_pagamento
│   │   ├── Nota.js              # Modelo nota
│   │   ├── Pagamento.js         # Modelo pagamento
│   │   ├── Avaliacao.js         # Modelo avaliacao
│   │   └── ImagemEspaco.js      # Modelo imagem_espaco
│   ├── uploads/                 # Imagens enviadas pelos utilizadores
│   ├── server.js                # API REST com todas as rotas
│   ├── package.json
│   └── .env                     # Variáveis de ambiente (não versionado)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Home
│   │   ├── login/page.js        # Login
│   │   ├── register/page.js     # Registo
│   │   ├── dashboard/page.js    # Dashboard com busca
│   │   ├── profile/page.js      # Perfil com edição
│   │   ├── my-reservations/     # Reservas do locatário
│   │   ├── reservations/        # Gestão de reservas (proprietário)
│   │   ├── pagamentos/          # Pagamentos e multas
│   │   ├── avaliar/             # Avaliação bidirecional
│   │   ├── consultas/           # Consultas SQL com gráficos
│   │   ├── ia/                  # Assistente IA de precificação
│   │   └── spaces/
│   │       ├── [id]/page.js     # Detalhe do espaço + reserva
│   │       ├── new/page.js      # Criar espaço
│   │       └── edit/[id]/       # Editar espaço
│   ├── components/
│   │   └── Navbar.js            # Navbar condicional por perfil
│   ├── .env.local               # URL da API (não versionado)
│   └── package.json
│
├── database_ddl_final.sql       # DDL completo com 13 tabelas
├── seed_data_v3.sql             # Dados de exemplo para testes
├── guia_completo_sql_v2.sql     # Guia SQL para apresentação
└── README.md
```

---

## 📄 Licença

Projeto académico desenvolvido para a disciplina de Banco de Dados I — UFSC Campus Araranguá, 2026.

---

*Repositório: [github.com/ludivinojosedasilva/ESPACOJA](https://github.com/ludivinojosedasilva/ESPACOJA)*
