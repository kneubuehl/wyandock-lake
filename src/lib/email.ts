// Mailgun email sender.
// Uses the existing Mailgun account that already powers Supabase auth SMTP
// (mail.wyandock.com). Sends via the Mailgun HTTP API.

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mail.wyandock.com'
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY
const MAILGUN_REGION = process.env.MAILGUN_REGION || 'us' // 'us' or 'eu'
const DEFAULT_FROM = process.env.MAIL_FROM || `Lake Wyandock <reservations@${MAILGUN_DOMAIN}>`

type SendEmailInput = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
}

export async function sendEmail(input: SendEmailInput) {
  if (!MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY not configured')
  }

  const host = MAILGUN_REGION === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net'
  const url = `https://${host}/v3/${MAILGUN_DOMAIN}/messages`

  const form = new URLSearchParams()
  form.append('from', input.from || DEFAULT_FROM)
  const recipients = Array.isArray(input.to) ? input.to : [input.to]
  for (const r of recipients) form.append('to', r)
  form.append('subject', input.subject)
  if (input.text) form.append('text', input.text)
  if (input.html) form.append('html', input.html)
  if (input.replyTo) form.append('h:Reply-To', input.replyTo)

  const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mailgun ${res.status}: ${body}`)
  }

  return res.json() as Promise<{ id: string; message: string }>
}
