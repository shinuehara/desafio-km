# Desafio KM

Sistema para desafios de corrida e caminhada entre família e amigos. Cada pessoa acumula km até a meta (ex.: 42 km) e ganha o kit (camiseta + medalha).

Foi feito para quem tem pouca familiaridade com tecnologia:

- **Sem app e sem senha.** Cada participante recebe um **link pessoal** pelo WhatsApp e entra por ele.
- **Registrar uma atividade leva 3 passos:** quantos km, quando e a foto do app, do relógio ou da esteira.
- **O grupo do WhatsApp continua sendo o lugar da festa.** Depois de registrar, um botão abre o WhatsApp com a mensagem pronta para o grupo.

## Participante

| Página | Endereço |
| --- | --- |
| Página do desafio: datas, kit, valor e regulamento em PDF | `/d/<desafio>` |
| Inscrição: nome, WhatsApp, turma, camiseta e endereço com preenchimento pelo CEP | `/d/<desafio>/inscricao` |
| Pagamento: PIX com QR Code e "Copia e Cola" | `/p/<link>/pagamento` |
| Página pessoal: progresso, convite para a próxima meta e histórico | `/p/<link>` |
| Registrar atividade (a foto é obrigatória) | `/p/<link>/registrar` |
| Ranking público por turma e geral, com o primeiro nome e a inicial do sobrenome | `/d/<desafio>/ranking` |
| "Já me inscrevi": abre o WhatsApp do organizador para pedir o link de novo | `/d/<desafio>/entrar` |

## Organizador (`/admin`)

O acesso é por uma senha única, definida em `ADMIN_PASSWORD`.

- **Atividades:** cada registro mostra a foto e os km marcados. Tudo conta na hora, e o botão **Invalidar** tira a atividade do total. Se foi engano, o botão vira **Desfazer**.
- **Inscritos:** confirmar o PIX, marcar o kit como enviado, **Enviar link** (abre o WhatsApp da pessoa com o link pessoal), excluir inscrições de teste e exportar uma planilha (CSV) com os endereços para o envio dos kits.
- **Ranking:** uma mensagem pronta por turma para colar no grupo, além do link do ranking público.
- **Configurar desafio:** datas, metas (ex.: `42, 100`), valor com frete, chave PIX, regulamento em PDF, foto do kit e turmas, cada uma com o próprio link de convite.

> **Sobre o PIX:** o QR Code é gerado a partir da chave PIX do organizador (PIX estático, sem intermediário e sem taxa). O sistema **não** confirma o pagamento sozinho: o organizador confere no banco e clica em **Confirmar PIX**. Cada código leva um identificador `DKM<link>`, que alguns bancos mostram no extrato.

## Rodar no computador

Requisitos: Node 20 ou mais recente e um Postgres.

```bash
npm install
```

```bash
cp .env.example .env
```

Edite o `.env` com o `DATABASE_URL` e uma senha. Depois:

```bash
npm run db:migrate
```

```bash
npm run db:seed -- --demo
```

```bash
npm run dev
```

O `db:seed -- --demo` cria um desafio de exemplo com participantes fictícios. Sem `--demo`, cria só o desafio.

Abra http://localhost:3000. O painel fica em http://localhost:3000/admin.

Sem as variáveis do Supabase, as fotos e os PDFs ficam na pasta `.data/`.

Testes automáticos:

```bash
npm test
```

## Publicar (grátis: Supabase + Netlify)

### 1. Supabase (banco e arquivos)

1. Crie uma conta em supabase.com e um projeto. Escolha a região **São Paulo**.
2. Em **Storage**, crie dois buckets:
   - `publico`, marcado como **Public bucket** (guarda o regulamento e a foto do kit);
   - `fotos`, **privado** (guarda as fotos das atividades, que só o organizador vê).
3. Em **Project Settings › Database › Connection string**, copie a URI do **Transaction pooler** (porta 6543). Esse é o `DATABASE_URL`.
4. Em **Project Settings › API**, copie a **Project URL** (`SUPABASE_URL`) e a chave **service_role** (`SUPABASE_SERVICE_ROLE_KEY`). Essa chave é secreta e nunca deve ir para o código.

### 2. Criar as tabelas

No seu computador, com o `DATABASE_URL` do Supabase no `.env`:

```bash
npm run db:migrate
```

### 3. Netlify (site)

O repositório já tem um `netlify.toml`. A Netlify reconhece o Next.js e usa o adaptador oficial sozinha.

1. Crie uma conta em netlify.com e escolha **Add new project › Import an existing project › GitHub**. Selecione este repositório; as configurações de build já vêm preenchidas.
2. Em **Project configuration › Environment variables**, cadastre todas as variáveis do `.env.example`:
   - `APP_URL`: o endereço final do site, ex.: `https://desafio-km.netlify.app`;
   - `SESSION_SECRET` e `CRON_SECRET`: textos aleatórios longos, que você pode gerar com `openssl rand -base64 32`.
3. Faça o deploy. Depois entre em `/admin`, crie o desafio e mande o link de inscrição no grupo.

A cada envio para a branch `main` no GitHub, a Netlify publica a nova versão sozinha.

Para usar um domínio próprio (ex.: `desafiokm.com.br`), configure em **Domain management** na Netlify e atualize o `APP_URL`.

> **Outra opção:** o mesmo código roda na Vercel sem mudanças. Basta importar o repositório lá e cadastrar as mesmas variáveis. Veja o aviso sobre uso comercial em "Custos e limites".

### 4. Limpeza automática das fotos (GitHub Actions, grátis)

As fotos das atividades são apagadas **30 dias depois do fim de cada desafio**. Os km continuam valendo; só a imagem some. Isso mantém o Supabase dentro do plano grátis, que tem cerca de 1 GB para arquivos.

1. Na hospedagem, cadastre a variável `CRON_SECRET` (passo 3).
2. No GitHub, em **Settings › Secrets and variables › Actions › New repository secret**, crie:
   - `APP_URL`: o endereço do site;
   - `CRON_SECRET`: o mesmo texto do passo 1.

O GitHub roda `.github/workflows/limpeza-fotos.yml` todo dia de madrugada. Para testar, vá em **Actions › Limpeza de fotos antigas › Run workflow**.

Depois que um desafio acaba, também dá para apagar as fotos na hora pelo painel, em **Configurar desafio › Fotos das atividades**.

Sempre que o banco mudar (novos arquivos em `drizzle/`), rode `npm run db:migrate` de novo com o `DATABASE_URL` de produção.

## Custos e limites (planos grátis)

| Peça | Plano | Limite que importa aqui |
| --- | --- | --- |
| Netlify | Free | Créditos mensais de uso; um desafio entre família e amigos fica bem abaixo. Arquivos enviados até 5 MB (limite de ~6 MB por requisição das funções) |
| Supabase | Free | ~500 MB de banco (sobra) e ~1 GB de arquivos; o projeto pausa depois de ~1 semana sem uso e é reativado com um clique |
| GitHub Actions | Grátis | Sobra para a limpeza diária |

**Fotos:** o celular reduz cada foto para no máximo 1280 px antes de enviar, o que dá cerca de 100 a 200 KB por foto. Assim, 1 GB comporta mais de 5.000 fotos ao mesmo tempo, e a limpeza libera o espaço a cada desafio.

**Uso comercial:** o plano grátis da Vercel (Hobby) é só para projetos sem fins comerciais, e as regras dela citam "pedir ou processar pagamento dos visitantes" como exemplo. Por isso a hospedagem recomendada aqui é a Netlify. Confira as regras atuais de qualquer hospedagem antes de publicar, porque elas mudam.

## Estrutura

```
src/
  app/
    d/[slug]/          página do desafio, inscrição, ranking, "já me inscrevi"
    p/[token]/         página pessoal, pagamento, registrar, comemoração
    admin/             painel do organizador
    api/arquivos/      arquivos locais (só sem Supabase)
  db/schema.ts         tabelas (challenges, teams, participants, activities)
  lib/                 PIX, datas, formatação, armazenamento, login do painel
drizzle/               migrações SQL
scripts/               migrate e seed
```

## Decisões e limites atuais

- **O link pessoal é a identidade da pessoa.** Quem tiver o link consegue registrar atividades por ela, o que é aceitável num desafio de incentivo. O link tem 10 caracteres aleatórios e não aparece em lugares públicos.
- **O ranking público** mostra só o primeiro nome e a inicial do sobrenome.
- **Não há envio automático de mensagens** pelo WhatsApp. Todos os botões usam links `wa.me`, que abrem o app com o texto pronto. Assim não há custo nem risco de bloqueio do número.
- **Ideias para depois:** confirmação automática do PIX por um intermediador (Mercado Pago, Asaas…), leitura automática dos km na foto e medalha virtual para compartilhar.
