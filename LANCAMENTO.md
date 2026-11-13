# Checklist de lançamento

Passo a passo para colocar o Desafio KM no ar pela primeira vez. Siga na ordem e marque cada item.

Tempo estimado: **1 a 2 horas**, incluindo o ensaio. Custo: **R$ 0** (planos grátis), mais o domínio se quiser um.

---

## 1. Contas (uma vez só)

- [ ] **GitHub:** já existe (`shinuehara/desafio-km`).
- [ ] **Supabase** (banco e fotos): crie a conta em supabase.com.
- [ ] **Netlify** (site): crie a conta em netlify.com, de preferência entrando com o GitHub.
- [ ] Antes de seguir, leia as regras de uso e os limites do plano grátis da Netlify. Elas mudam com o tempo.

## 2. Supabase

- [ ] Crie um projeto. Região: **South America (São Paulo)**. Anote a senha do banco num lugar seguro.
- [ ] No botão **Connect** do projeto, copie:
  - a URI do **Transaction pooler** (porta **6543**), que vira o `DATABASE_URL`;
  - a URI do **Session pooler** (porta **5432**), que vira o `DATABASE_URL_DIRECT`.

  Nas duas, troque `[YOUR-PASSWORD]` pela senha do banco.
- [ ] Em **Project Settings › API Keys**, copie:
  - a **Project URL**, que vira o `SUPABASE_URL`;
  - a chave secreta, que vira o `SUPABASE_SERVICE_ROLE_KEY`: a **service_role** (aba "Legacy API Keys", começa com `eyJ`) ou a **Secret key** (começa com `sb_secret_`). As duas funcionam. Ela é **secreta**: nunca mande por WhatsApp nem coloque no código. Nunca use a `anon` nem a `publishable`.

Você **não** precisa criar tabelas nem pastas no Supabase: a primeira publicação cria tudo sozinha.

## 3. Netlify

- [ ] **Add new project › Import an existing project › GitHub** e escolha `desafio-km`.
- [ ] Em **Branch to deploy**, escreva `producao`. Assim, o site só é publicado quando você mandar (passo 5).
- [ ] Em **Environment variables**, cadastre as variáveis abaixo antes do primeiro deploy:

  | Variável | Valor |
  | --- | --- |
  | `DATABASE_URL` | Transaction pooler do Supabase (porta 6543) |
  | `DATABASE_URL_DIRECT` | Session pooler do Supabase (porta 5432) |
  | `SUPABASE_URL` | Project URL do Supabase |
  | `SUPABASE_SERVICE_ROLE_KEY` | chave service_role do Supabase |
  | `ADMIN_PASSWORD` | senha do painel do organizador (forte, com 12 caracteres ou mais) |
  | `SESSION_SECRET` | texto aleatório longo (veja abaixo) |
  | `CRON_SECRET` | outro texto aleatório longo |
  | `APP_URL` | endereço do site, ex.: `https://desafio-km.netlify.app` (ajuste depois de ver o endereço que a Netlify der) |

  Para gerar textos aleatórios, use um gerenciador de senhas ou rode `openssl rand -base64 32` num terminal.
- [ ] Em **Project configuration › Build & deploy › Branches and deploy contexts**:
  - **Branch deploys:** *None*;
  - **Deploy Previews:** *Don't deploy*.

  Assim, nada além da `producao` gasta créditos.
- [ ] Se a Netlify permitir escolher a **região das funções** (Project configuration › Functions), escolha **São Paulo** ou a mais próxima. Isso deixa as páginas mais rápidas, porque o banco fica em São Paulo.

## 4. GitHub (limpeza automática das fotos)

- [ ] Em **Settings › Secrets and variables › Actions › New repository secret**, crie:
  - `APP_URL`: o mesmo endereço do site;
  - `CRON_SECRET`: o mesmo texto cadastrado na Netlify.

## 5. Primeira publicação

- [ ] No GitHub: **Actions › Publicar no site › Run workflow**. Digite `PUBLICAR` e confirme.
  - A ação confere o código (tipos e testes) e copia a `main` para a `producao`.
  - A Netlify publica em alguns minutos. A primeira publicação também cria as tabelas e as pastas de arquivos no Supabase.
- [ ] Na Netlify, abra **Deploys** e confira se ficou **Published**. Se falhar, o log mostra o motivo, por exemplo: "O Supabase recusou a chave…".
- [ ] Se o endereço do site for diferente do que você pôs em `APP_URL`, corrija a variável e publique de novo.

> **Lembrete:** cada publicação gasta créditos da Netlify (cerca de 15). Mudar desafio, preço, PDF, turmas ou confirmar PIX **não** precisa de publicação: tudo isso é feito no painel.

## Antes do ensaio: privacidade (LGPD)

O sistema guarda nome, WhatsApp, endereço e fotos. Ele já mostra na inscrição para que os dados servem, pede o aceite e tem a página **Como cuidamos dos seus dados** (link no rodapé da página do desafio).

- [ ] Cadastre no painel o **nome e o WhatsApp do organizador**: a página de privacidade indica esse contato para quem quiser ver, corrigir ou apagar os dados.
- [ ] No **regulamento em PDF**, inclua um parágrafo curto com o mesmo conteúdo: quais dados, para que, quem vê e como pedir a exclusão.
- [ ] Se alguém pedir para apagar os dados: painel › Inscritos › **Excluir**. Apaga a inscrição, as atividades e as fotos.

Este é um cuidado básico para um desafio entre família e amigos, não uma consultoria jurídica. Se o projeto crescer e virar algo comercial, vale revisar com um advogado.

## 6. Ensaio geral (antes de chamar todo mundo)

Faça com um **desafio de teste** e o seu próprio celular. Se possível, repita num **Android** e num **iPhone**.

- [ ] Entre em `/admin` com a senha. **Não pode aparecer** a caixa vermelha "Configuração incompleta".
- [ ] Crie um desafio de teste com valor **R$ 1,00** e a chave PIX real.
- [ ] Envie um PDF de regulamento e a foto do kit, e crie uma turma.
- [ ] Pelo link de inscrição, inscreva-se como participante:
  - [ ] o CEP preenche o endereço;
  - [ ] o QR Code e o "Copia e Cola" funcionam no app do banco, com **nome do recebedor e valor certos**. Pague o R$ 1,00;
  - [ ] "Mandar o link no meu WhatsApp" abre o WhatsApp com a mensagem. Ao enviar, aparece a **prévia** com a imagem do Desafio KM.
- [ ] No painel, confirme o PIX e use **Enviar link**.
- [ ] Pelo link `/r/…` recebido, registre uma atividade **com foto da câmera** e outra **com print da galeria**.
- [ ] No painel, aba **Atividades**: as fotos aparecem; teste **Invalidar** e **Desfazer**.
- [ ] Confira o ranking público e o gráfico na página pessoal.
- [ ] No celular, use **Adicionar à tela inicial** e abra pelo ícone.
- [ ] Na aba **Inscritos**, teste **Lançar km pelo organizador**.
- [ ] Exporte as duas planilhas (inscritos e atividades) e abra no Excel ou no Google Planilhas.
- [ ] Por fim, em **Configurar desafio › Excluir desafio**, apague o desafio de teste.

## 7. Migrar o desafio que já está em andamento

Os participantes atuais já têm km acumulados nas contas feitas à mão. Sugestão:

1. No painel, crie o desafio com as datas reais (ex.: 15/10 a 24/12) e as metas `42, 100`.
2. Mande no grupo o link de inscrição (mensagem modelo abaixo). Cada pessoa se inscreve e informa o endereço do kit.
3. Para quem já pagou, clique em **Confirmar PIX** sem esperar novo pagamento.
4. Para cada pessoa, use **Lançar km pelo organizador** com o saldo atual da tabela e o motivo "Saldo antes do sistema".
5. Use **Enviar link** para cada pessoa. A partir daí, os registros novos são pelo link.

Se a pessoa já estava na meta de 100 km, depois do lançamento ela mesma vê o convite e aceita na página pessoal.

### Mensagem modelo para o grupo

```
Pessoal, o desafio agora tem um site! 🏃‍♀️🚶

1) Faça sua inscrição (leva 2 minutos): <LINK DE INSCRIÇÃO>
2) Você vai receber no WhatsApp um link só seu.
3) Depois de cada corrida ou caminhada, toque no link, anote os km e mande a foto.

Os km que vocês já fizeram estão guardados: eu lanço no sistema.
O grupo continua aqui para a gente comemorar!
```

## 8. No dia a dia

- **Confirmar PIX:** painel › Inscritos › Confirmar PIX.
- **Conferir fotos:** painel › Atividades. Tudo entra no total na hora; invalide só o que estiver errado.
- **Parcial no grupo:** painel › Ranking › Copiar mensagem para o grupo.
- **Fim do desafio:** exporte a planilha de inscritos com os endereços para o envio dos kits e use **Marcar enviado**. As fotos se apagam sozinhas 30 dias depois.
- **Créditos:** de vez em quando, olhe o consumo no painel da Netlify. Evite publicar mudanças durante um desafio, a não ser correções urgentes.

## Se algo der errado

| Sinal | O que fazer |
| --- | --- |
| Caixa vermelha "Configuração incompleta" no painel | Cadastre a variável indicada na Netlify e publique de novo |
| Publicação falhou na Netlify | Abra o log do deploy; a mensagem diz o que falta |
| Site fora do ar logo no começo do mês | Pode ter acabado o crédito do plano grátis: veja o consumo na Netlify |
| Página "Ops, algo deu errado" | Espere um minuto. Se o Supabase ficou parado mais de uma semana, ele pode ter pausado o projeto: reative no painel do Supabase |
| Pessoa perdeu o link | Painel › Inscritos › **Enviar link** |
