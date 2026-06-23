# Roadmap — Performance, Estabilidade, Testes e Limpeza

> Documento de análise técnica do Modoboa. Reúne as melhorias de
> performance (CPU/memória), estabilidade, cobertura de testes e limpeza
> de código identificadas, organizadas por prioridade. Serve como guia
> incremental — cada item pode virar uma issue/PR independente.

## 0. Bug corrigido neste PR — tradução PT-BR (frontend)

**Sintoma:** ao selecionar **Português (BR)** a interface quebrava na
renderização.

**Causa raiz:** o vue3-gettext usa o identificador interno `pt_BR` (com
_underscore_). Esse valor era repassado diretamente para a API `Intl`
(via `luxon` em `$date` e `filesize` em `$filesize`, em
`frontend/src/plugins/filters.js`). A `Intl` só aceita _language tags_
BCP 47 com hífen (`pt-BR`); um underscore lança `RangeError:
Incorrect locale information provided`, derrubando a renderização de
qualquer componente que use esses filtros (cotas, tamanhos de caixa,
datas — usados em ~20 pontos: webmail, identidades, domínios, logs,
dashboard).

`pt_BR` é, hoje, **o único locale do frontend com subtag de região**
(`xx_YY`), por isso o problema se manifestava especificamente no
Português (BR) e não nos demais idiomas.

**Correção:** novo helper `localeToBCP47()` em `frontend/src/utils.js`
que converte `pt_BR` → `pt-BR` antes de entregar o locale a qualquer
consumidor de `Intl`. Aplicado em `$date` e `$filesize`.

```
new Intl.NumberFormat('pt_BR')  // RangeError  ❌
new Intl.NumberFormat('pt-BR')  // OK            ✅
```

### Débito relacionado (mesma família de bug, recomendado tratar em seguida)
- **Códigos de idioma inconsistentes em toda a stack.** Backend
  (`modoboa/core/constants.py`) usa `pt-br`, `zh-hant`; o frontend
  (`gettext.config.cjs`, `plugins/gettext.js`) usa `pt_BR`, `zh`; o
  histórico do banco tem registros antigos como `pt_BR`. O mapeamento
  ad-hoc em `auth.store.js::accountLanguage` cobre `pt-br → pt_BR`, mas
  **não** cobre `zh-hant → zh_HANT` (que não existe na lista de idiomas
  do gettext) nem `ro`/`pt` (sem tradução no frontend). Recomenda-se
  centralizar a normalização de códigos de idioma em **um único** lugar
  (util compartilhado), alinhando: choices do Django ↔ pastas de locale
  ↔ chaves do `translations.json` ↔ tags BCP 47 para `Intl`/HTTP.
- **Vuetify fixo em `'en'`** (`plugins/vuetify.js:54`): date pickers e
  componentes nativos do Vuetify nunca traduzem. Conectar ao locale
  ativo do gettext.
- **Sem teste de regressão** para o locale. Ver seção 3.

---

## 1. Performance (CPU / memória) — prioridade ALTA

### 1.1 `LocalConfigMiddleware` consulta o banco a cada request
`modoboa/core/middleware.py` executa `LocalConfig.objects.first()` em
**toda** requisição (inclusive chamadas de API), e instancia um
`param_tools.Manager` a partir do JSON de parâmetros. Em uma VPS com
carga moderada isso significa 1 query + desserialização de JSON por
request — desperdício direto de CPU e de conexões de banco.

**Ação:** cachear o `LocalConfig` (muda raramente) no cache do Django
com invalidação no `save()` do modelo (signal `post_save`). Impacto
alto, risco baixo.

### 1.2 Backend de cache padrão é `FileBasedCache`
No template de settings (`modoboa/core/commands/templates/settings.py.tpl`)
e no `test_project`, o cache padrão é `FileBasedCache` (em disco). Sob
concorrência isso gera I/O de disco e _lock contention_, e não é
compartilhado eficientemente entre workers/processos — aumenta latência
e uso de CPU.

**Ação:** documentar/recomendar fortemente **Redis** como cache padrão
em produção (o `docker-compose` já usa Redis). Combinar com 1.1 e 1.3.

### 1.3 Sessões em banco (default do Django)
`SESSION_ENGINE` não é sobrescrito → sessões usam o backend de banco,
gerando leitura/escrita de sessão a cada request autenticado.

**Ação:** usar `cached_db` ou sessões em Redis em produção.

### 1.4 Pooling / persistência de conexões de banco
Verificar `CONN_MAX_AGE` (não definido → conexões novas por request).
Definir um valor > 0 (ou usar pooler) reduz overhead de handshake e o
consumo de memória/CPU por reconexão.

### 1.5 Auditoria de N+1 queries nos viewsets quentes
Há 29 arquivos usando `select_related`/`prefetch_related`, mas vale uma
passada com `django-debug-toolbar`/`nplusone` nos endpoints de listagem
(identidades, domínios, logs, webmail) para garantir que serializers
aninhados não disparem N+1. Itens com alto volume de linhas são os mais
sensíveis.

### 1.6 Perfilamento sob carga (pré-requisito de tudo acima)
Antes de otimizar às cegas, instrumentar produção:
- `django-silk` ou APM (queries por endpoint, tempo, alocação).
- Métricas de processo (RSS por worker do gunicorn/uvicorn, nº de
  workers vs. CPU da VPS — _over-provisioning_ de workers é causa comum
  de alto consumo de memória).
- Inspecionar tarefas Celery periódicas (frequência × custo).

---

## 2. Estabilidade — prioridade MÉDIA

- **Tratamento de erro no frontend resiliente a locale inválido:** os
  filtros de formatação não devem derrubar a árvore de render por causa
  de um locale malformado. O `localeToBCP47` resolve o caso atual, mas
  vale um _fallback_ defensivo (try/catch → `'en'`) nos formatadores.
- **`accountLanguage` defensivo:** se o código de idioma do usuário não
  existir na lista de idiomas disponíveis, cair para `defaultLanguage`
  ('en') em vez de setar um valor inválido em `gettext.current`.
- **Middleware de exceção:** `CommonExceptionCatcher` só captura
  `ModoboaException`; garantir logging estruturado das demais para não
  mascarar erros 500.

---

## 3. Testes — prioridade MÉDIA/ALTA

- **Frontend sem runner de testes.** Não há vitest/jest configurado.
  Adicionar **Vitest** e cobrir, no mínimo:
  - `localeToBCP47` (caso `pt_BR → pt-BR`, idempotência de `en`, etc.);
  - `auth.store.accountLanguage` (mapeamentos de código de idioma);
  - filtros `$date`/`$filesize` não lançam com `pt_BR` ativo
    (regressão direta do bug deste PR).
- **`tox.ini` desatualizado:** `envlist = py{37,38,39,310}` enquanto o
  `pyproject.toml` declara suporte a **3.10–3.14**. A matriz de teste
  não reflete as versões suportadas (e ainda testa 3.7–3.9, já fora de
  suporte). Atualizar para `py{310,311,312,313,314}`.
- **CI de tradução:** validar que todo código em `constants.LANGUAGES`
  possui pasta de locale correspondente no backend e chave no
  `translations.json` do frontend, evitando reincidência da família de
  bugs da seção 0.

---

## 4. Limpeza / remoção — prioridade BAIXA (ganhos rápidos)

- **Feito neste PR:** removido `frontend/yarn-error.log` (2659 linhas,
  versionado por engano) e adicionado ao `.gitignore`.
- Revisar `tox.ini` (ambientes legados de Python — ver seção 3).
- Auditar dependências não utilizadas em `pyproject.toml`/`package.json`
  (`depcheck` no frontend, `pip-extra-reqs`/`deptry` no backend).
- Conferir locales órfãos: pastas em `modoboa/locale` e
  `frontend/src/locale` sem entrada correspondente em
  `constants.LANGUAGES` (ex.: vários `xx_YY` no backend que o frontend
  não expõe) — consolidar para reduzir ruído de manutenção.

---

## Ordem sugerida de execução

1. **(este PR)** Fix PT-BR + limpeza do `yarn-error.log` + este roadmap.
2. Cache do `LocalConfig` (1.1) + Redis para cache/sessão (1.2/1.3).
3. Instrumentação/perfilamento (1.6) para guiar o restante.
4. Vitest + testes de regressão de locale (3) e atualização do `tox.ini`.
5. Normalização única de códigos de idioma (débito da seção 0).
6. Auditoria de N+1 (1.5) e dependências (4).
