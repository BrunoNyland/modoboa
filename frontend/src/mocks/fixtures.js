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
  language: 'pt_br',
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
  { name: 'webmail', label: 'Webmail' },
  { name: 'admin', label: 'Administração' },
  { name: 'calendars', label: 'Agenda' },
  { name: 'contacts', label: 'Contatos' },
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
    { name: 'INBOX', label: 'Caixa de entrada', type: 'inbox', unseen: 3 },
    { name: 'Drafts', label: 'Rascunhos', type: 'draft' },
    { name: 'Sent', label: 'Enviados', type: 'sent' },
    { name: 'Junk', label: 'Spam', type: 'junk', unseen: 1 },
    { name: 'Trash', label: 'Lixeira', type: 'trash' },
  ],
}

export const quota = { quota: 0, quota_usage: 12 }

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
