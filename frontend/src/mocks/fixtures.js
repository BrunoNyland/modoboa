/**
 * Dados de exemplo para o modo de desenvolvimento sem backend (MSW).
 *
 * Edite/expanda à vontade — é só dado falso para a interface renderizar.
 */

export const currentUser = {
  pk: 1,
  username: 'admin@example.com',
  email: 'admin@example.com',
  first_name: 'Dev',
  last_name: 'Admin',
  role: 'SuperAdmins',
  language: 'pt-br',
  phone_number: null,
  secondary_email: null,
  tfa_enabled: false,
  totp_enabled: false,
  webauthn_enabled: false,
  mailbox: {
    pk: 1,
    full_address: 'admin@example.com',
    quota: 0,
    use_domain_quota: true,
  },
  permissions: [],
}

// /account/available_applications/
export const applications = [
  {
    name: 'webmail',
    label: 'Webmail',
    icon: 'mdi-at',
    description: 'Webmail',
    url: '/user/webmail',
  },
  {
    name: 'admin',
    label: 'Administração',
    icon: 'mdi-toolbox',
    description: 'Painel de Administração',
    url: '/admin',
  },
  {
    name: 'calendar',
    label: 'Calendários',
    icon: 'mdi-calendar',
    description: 'Calendário',
    url: '/user/calendars',
  },
  {
    name: 'contacts',
    label: 'Contatos',
    icon: 'mdi-contacts-outline',
    description: 'Agenda de Contatos',
    url: '/user/contacts',
  },
]

// /parameters/global/applications/
export const parameterApps = [
  { name: 'core', label: 'Geral' },
  { name: 'admin', label: 'Administração' },
]

// /webmail/mailboxes/
export const mailboxes = {
  hdelimiter: '.',
  mailboxes: [
    { name: 'INBOX', label: 'Caixa de entrada', type: 'inbox', unseen: 3, nbmessages: 128 },
    { name: 'Drafts', label: 'Rascunhos', type: 'draft', nbmessages: 2 },
    { name: 'Sent', label: 'Enviados', type: 'sent', nbmessages: 87 },
    { name: 'Junk', label: 'Spam', type: 'junk', unseen: 1, nbmessages: 5 },
    { name: 'Trash', label: 'Lixeira', type: 'trash', nbmessages: 12 },
  ],
}

// /webmail/mailboxes/quota/  (current/limit in KiB, usage in %)
export const quota = { usage: 25, current: 524288, limit: 2097152 }

// /webmail/emails/?mailbox=INBOX&page=1
export const emails = {
  count: 2,
  first_index: 1,
  last_index: 2,
  prev_page: null,
  next_page: null,
  results: [
    {
      imapid: '2',
      subject: 'Bem-vindo ao Modoboa (mock)',
      from_address: { fulladdress: 'noreply@example.com', name: 'Modoboa' },
      date: '2026-06-24T12:00:00Z',
      size: 4096,
      style: 'unseen',
      answered: false,
      forwarded: false,
      flagged: false,
      attachments: false,
    },
    {
      imapid: '1',
      subject: 'Relatório semanal',
      from_address: { fulladdress: 'reports@example.com', name: 'Reports' },
      date: '2026-06-23T08:30:00Z',
      size: 20480,
      style: '',
      answered: true,
      forwarded: false,
      flagged: true,
      attachments: true,
    },
  ],
}

// /domains/
export const domains = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: 1,
      name: 'example.com',
      type: 'domain',
      enabled: true,
      domainalias_count: 0,
      mailbox_count: 2,
      mbalias_count: 0,
      quota: 0,
      allocated_quota: 0,
    },
  ],
}

// /identities/
export const identities = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: 1,
      identity: 'admin@example.com',
      name: 'Dev Admin',
      tags: [{ name: 'account', label: 'conta', type: 'idt' }],
      possible_actions: [],
    },
  ],
}

// /alarms/
export const alarms = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      created: '2026-06-24T10:15:30Z',
      status: 1,
      domain: { name: 'example.com' },
      mailbox: { address: 'admin' },
      title: 'Failed login attempts exceeded limit',
    },
    {
      id: 2,
      created: '2026-06-23T14:22:05Z',
      status: 2,
      domain: { name: 'example.com' },
      mailbox: null,
      title: 'Disk usage critical threshold (92%)',
    },
    {
      id: 3,
      created: '2026-06-24T18:05:00Z',
      status: 1,
      domain: { name: 'example.com' },
      mailbox: { address: 'user' },
      title: 'Spam outbound rate limit reached',
    },
  ],
}

// /email-providers/
export const emailProviders = [
  {
    id: 1,
    name: 'Gmail Migration',
    address: 'imap.gmail.com',
    port: 993,
    secured: true,
    domains: [],
  },
  {
    id: 2,
    name: 'Outlook Migration',
    address: 'outlook.office365.com',
    port: 993,
    secured: true,
    domains: [],
  },
]

// /migrations/
export const migrations = [
  {
    id: 1,
    provider: { name: 'Gmail Migration' },
    username: 'old_user@gmail.com',
    mailbox: { user: 1, full_address: 'admin@example.com' },
  },
]

// /parameters/user/applications/
export const userParameterApps = [
  { name: 'core', label: 'Geral' },
]

// /fido/
export const fidoCreds = [
  {
    id: 1,
    name: 'Chave de Segurança Yubikey',
    added_on: '2026-06-24T12:00:00Z',
    last_used: null,
    use_count: 0,
    enabled: true,
  },
]

// /account/forward/
export const forward = {
  recipients: 'backup@example.com, archive@example.com',
  keepcopies: true,
}

// /account/armessage/
export const armessage = {
  enabled: false,
  subject: "Estou ausente / Out of Office",
  content: "Olá,\n\nAtualmente estou ausente e responderei assim que retornar.\n\nAtenciosamente,\n%(name)s",
  fromdate: "2026-06-25T08:00:00+00:00",
  untildate: "2026-07-02T18:00:00+00:00",
}

// /account/api_token/
export const apiToken = {
  token: '8f7d9a3b5c6e1f0d2a4b6c8d0e2f4a6b8c0d2e4f',
}

// /account/filtersets/
export const filtersets = [
  { name: 'Filtros Padrão', active: true },
  { name: 'Regras Alternativas', active: false },
]

// /account/filtersets/condition_templates/
export const conditionTemplates = [
  {
    name: 'subject',
    label: 'Subject',
    operators: [
      { name: 'contains', label: 'contains', type: 'string' },
      { name: 'not_contains', label: 'does not contain', type: 'string' },
      { name: 'is', label: 'is', type: 'string' },
    ],
  },
  {
    name: 'from',
    label: 'From',
    operators: [
      { name: 'contains', label: 'contains', type: 'string' },
      { name: 'is', label: 'is', type: 'string' },
    ],
  },
]

// /account/filtersets/action_templates/
export const actionTemplates = [
  {
    name: 'fileinto',
    label: 'File into',
    args: [
      {
        name: 'mailbox',
        type: 'list',
        label: 'Mailbox',
        choices: [
          { name: 'INBOX', label: 'Caixa de entrada' },
          { name: 'Junk', label: 'Spam' },
          { name: 'Trash', label: 'Lixeira' },
        ],
      },
    ],
  },
  {
    name: 'keep',
    label: 'Keep',
    args: [],
  },
  {
    name: 'discard',
    label: 'Discard',
    args: [],
  },
]

// /account/filtersets/:filterset/filters/
export const filtersMap = {
  'Filtros Padrão': [
    {
      name: 'Mover Spam',
      enabled: true,
      match_type: 'anyof',
      conditions: [
        { name: 'subject', operator: 'contains', value: '[SPAM]' },
      ],
      actions: [
        { name: 'fileinto', args: { mailbox: 'Junk' } },
      ],
    },
  ],
  'Regras Alternativas': [],
}




