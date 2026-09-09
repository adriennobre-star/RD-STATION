# Arquitetura de Jornada Comercial Integrada — TERMAQ Bobinas

Arquitetura de soluções digitais unindo **RD Station Marketing**, **RD Station CRM** e **RD Station Conversas** para transformar tráfego pago em oportunidades qualificadas, oportunidades em negociações e negociações em vendas.

**Artefato visual (apresentação executiva):**
https://claude.ai/code/artifact/8b14dddf-2484-4e5b-aaca-0103b4ac6b9b

Este documento é a base técnica do artefato acima. Segue rigorosamente a documentação pública das APIs RD Station — nenhum endpoint, gatilho ou funcionalidade foi presumido além do que está documentado. Onde existe dependência de configuração, integração via API/webhook ou desenvolvimento de middleware, isso é sinalizado explicitamente.

## 1. Documentação oficial consultada

| Solução | Referência |
|---|---|
| RD Station Marketing (RDSM) | https://developers.rdstation.com/reference/introducao-rdsm |
| RD Station CRM v2 | https://developers.rdstation.com/reference/crm-v2-introduction |
| RD Station Conversas v2 | https://developers.rdstation.com/reference/conversas-v2-introduction |
| Webhook Service (RD Station) | https://developers.rdstation.com/reference/webhooks |

> Nota de acesso: a pesquisa técnica deste documento foi feita via busca e conhecimento consolidado sobre a documentação pública `developers.rdstation.com`, pois o acesso direto por fetch de página estava bloqueado no ambiente de execução usado para produzir este material. Antes de qualquer desenvolvimento, a equipe técnica deve validar os endpoints e payloads exatos diretamente no portal oficial.

## 2. O que cada solução faz nativamente (segundo a documentação)

### RD Station Marketing (RDSM)
- **Autenticação**: API Key (uso restrito a eventos de conversão — ideal para formulários e sistemas internos que enviam leads) ou OAuth2 (acesso completo: eventos, marcar/desmarcar oportunidade, registrar venda, atualizar contato sem conversão, consultar dados).
- **Captura nativa**: Landing pages, formulários e pop-ups do próprio RD Station capturam automaticamente UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) e demais dados do evento de conversão (nome, e-mail, empresa, telefone, campos personalizados).
- **Marcação de Oportunidade**: recurso nativo ("estrela") que sinaliza que um lead está pronto para abordagem comercial.
- **Automação/nutrição**: fluxos de automação nativos, disparados por conversão, tag, campo, ou webhook recebido.
- **Webhooks de saída**: dois gatilhos nativos — *Conversão* (lead completou uma conversão) e *Oportunidade* (lead marcado com a estrela). Podem alimentar sistemas externos, inclusive o CRM.

### RD Station CRM v2
- API REST organizada por recursos: contatos, organizações, negociações (*deals*), estágios/funis (*deal stages/pipelines*), tarefas/atividades, usuários, campos personalizados.
- Criação/atualização de negociação aceita `stage_id` (estágio/funil) e `custom_fields` (`custom_field_id` + `value`).
- **Webhooks nativos** de negociação: `crm_deal_created`, `crm_deal_updated`, `crm_deal_deleted` — cada evento envia um snapshot completo da negociação, não um diff. Para saber *qual* mudou de etapa, o receptor (middleware) precisa comparar o `stage_id` recebido com o estado anterior armazenado.

### RD Station Conversas v2
- Recursos disponíveis atualmente são **todos voltados a WhatsApp**: contatos, mensagens, templates, funcionários, carteiras, workflows, flows, campos personalizados, relatórios, jobs.
- Autenticação OAuth 2.0 (Bearer token).
- **Envio de mensagem fora da janela de atendimento de 24h** (contada a partir do último contato do cliente) exige um **template pré-aprovado pela Meta/WhatsApp Business** — restrição da própria plataforma WhatsApp, não do RD Station.

## 3. O que é nativo vs. o que exige integração

| Ponte | Direção | Classificação | Observação |
|---|---|---|---|
| Anúncio → LP/Formulário RDSM | Marketing | **Nativo** | Captura de UTM automática na conversão. |
| Lead qualificado → Oportunidade (estrela) | Marketing | **Nativo** | Recurso interno do RD Marketing. |
| Oportunidade (RDSM) → Contato/Negociação (CRM) | Marketing → CRM | **Nativo, requer configuração** | Depende da integração Marketing↔CRM habilitada na conta RD Station; regras finas de mapeamento de campo/etapa podem exigir webhook + API para controle total. |
| Mudança de etapa no CRM → Automação de nutrição no Marketing | CRM → Marketing | **API/Webhook + middleware** | Sem gatilho nativo direto; requer webhook `crm_deal_updated`, lógica de comparação de estágio e chamada à API do RDSM (evento, tag ou campo personalizado) para acionar o fluxo. |
| Negociação em etapa de decisão → Abertura de conversa no Conversas | CRM → Conversas | **API/Webhook + middleware** | Não há gatilho nativo documentado ligando etapa do CRM ao início de uma cadência no Conversas; requer webhook de negociação + chamada à API do Conversas (criar/atribuir conversa, disparar template aprovado). |
| Mensagens/desfecho da conversa → Histórico da negociação | Conversas → CRM | **API/Webhook + middleware** | Requer webhook de mensagem/conversa no Conversas + chamada à API do CRM para registrar atividade, nota ou atualizar campo personalizado da negociação. |
| Fechamento da negociação (Ganho/Perdido) | CRM | **Ação humana, nativa no CRM** | Vendedor(a) atualiza o resultado diretamente no funil. |

## 4. Jornada comercial (10 etapas)

1. **Atração** — TERMAQ investe em tráfego pago; anúncio direciona para LP/formulário.
2. **Captura** — Lead entra no RD Station Marketing com nome, empresa, telefone/WhatsApp, e-mail, origem, campanha, mídia, anúncio, interesse/produto e demais dados disponíveis no evento de conversão.
3. **Qualificação** — Critérios sugeridos (a validar com a TERMAQ): perfil da empresa, potencial de compra, necessidade, urgência, produto, volume, localização, interação com campanhas, comportamento digital.
   - Não qualificado → nutrição ou saída do fluxo comercial.
   - Qualificado → segue para o CRM.
4. **Envio ao CRM** — Contato criado/atualizado; negociação aberta em etapa inicial do funil (ver classificação de nativo/integração na seção 3).
5. **Pré-venda** — Pré-vendas analisa o lead, faz contato, registra atividades e avança/retrocede a etapa no CRM.
6. **Mudança de etapa → gatilho de relacionamento** — Etapas relevantes podem acionar nutrição no Marketing (via integração, seção 3).
7. **Momento de decisão** — Etapa de maior intenção de compra aciona o RD Conversas.
8. **Conversação/cadência** — WhatsApp conduz abordagem, follow-up, tratamento de dúvidas/objeções e retomada, respeitando a janela de 24h e templates aprovados quando aplicável.
9. **Retorno ao CRM** — Interações relevantes atualizam histórico e etapa da negociação (via integração, seção 3).
10. **Conversão** — Lead → Oportunidade → Cliente, com histórico da jornada preservado no CRM.

## 5. Visão de dados

```
Lead
 ├─ dados de identificação (nome, empresa, telefone, e-mail)
 ├─ dados de origem (canal, campanha, mídia, anúncio — UTM)
 ├─ dados de comportamento digital
 └─ dados de qualificação
     ↓
  Contato
     ↓
  Oportunidade
     ↓
  Interações (Conversas)
     ↓
  Histórico comercial (CRM)
     ↓
  Venda
```

## 6. Responsabilidades

| Etapa | Quem executa | Solução |
|---|---|---|
| Atração | Marketing (mídia paga) | RD Marketing |
| Captura e identificação | Automação | RD Marketing |
| Qualificação | Automação | RD Marketing |
| Envio ao CRM | Sistema (integração) | RD Marketing → RD CRM |
| Pré-venda / diagnóstico | Pré-vendas | RD CRM |
| Nutrição por mudança de etapa | Automação (via integração) | RD CRM → RD Marketing |
| Momento de decisão | Sistema (integração) | RD CRM → RD Conversas |
| Cadência / conversação | Atendimento / Vendas | RD Conversas |
| Retorno do histórico | Sistema (integração) | RD Conversas → RD CRM |
| Fechamento | Vendas | RD CRM |

## 7. Regras de negócio propostas (sujeitas a validação da TERMAQ)

1. Todo novo lead deve possuir origem identificável.
2. Lead sem critérios mínimos de qualificação não deve consumir esforço comercial imediato.
3. Lead qualificado deve possuir oportunidade/negociação correspondente no CRM.
4. Mudanças relevantes de estágio comercial podem gerar ações de nutrição.
5. O momento de maior intenção de compra deve ativar a estratégia de conversação via WhatsApp.
6. Interações relevantes devem retornar ao histórico comercial do CRM.
7. O CRM deve representar o estado atual e real da oportunidade.

## 8. O que a TERMAQ ganha com essa arquitetura

- Maior aproveitamento dos leads gerados por campanhas.
- Redução de perda de oportunidades entre marketing e vendas.
- Processo comercial mais organizado, com etapas e responsáveis claros.
- Maior velocidade de atendimento no momento de decisão do lead.
- Visão integrada da jornada e do histórico do cliente entre as três soluções.

## 9. Próximos passos recomendados

1. Validar com a TERMAQ os critérios reais de qualificação (seção 3 da proposta original) e as etapas do funil no CRM.
2. Confirmar no painel RD Station se a integração nativa Marketing↔CRM está disponível no plano contratado e habilitá-la.
3. Especificar e desenvolver o middleware responsável pelas três pontes de API/webhook mapeadas na seção 3 (CRM→Marketing, CRM→Conversas, Conversas→CRM).
4. Definir e submeter à Meta os templates de WhatsApp necessários para contato fora da janela de 24h.
