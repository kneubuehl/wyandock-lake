import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { format, parseISO } from 'date-fns'

// Webhook called by a Postgres trigger (pg_net.http_post) when a row
// is inserted into public.reservations. Sends a notification email
// to the caretaker(s).
//
// The trigger should POST:
//   { reservation_id: "<uuid>" }
// with header:
//   x-webhook-secret: <NOTIFY_WEBHOOK_SECRET>

export async function POST(request: NextRequest) {
  const expected = process.env.NOTIFY_WEBHOOK_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  const got = request.headers.get('x-webhook-secret')
  if (got !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const reservationId: string | undefined = body.reservation_id
  if (!reservationId) {
    return NextResponse.json({ error: 'reservation_id required' }, { status: 400 })
  }

  // Fetch the reservation with the guest's name
  const { data: reservation, error: resError } = await supabaseAdmin
    .from('reservations')
    .select('id, start_date, end_date, notes, created_at, profiles:user_id(display_name, email)')
    .eq('id', reservationId)
    .single()

  if (resError || !reservation) {
    return NextResponse.json({ error: resError?.message || 'Reservation not found' }, { status: 404 })
  }

  // Fetch all caretakers
  const { data: caretakers, error: caretakerError } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name')
    .eq('role', 'caretaker')

  if (caretakerError) {
    return NextResponse.json({ error: caretakerError.message }, { status: 500 })
  }

  if (!caretakers || caretakers.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no caretakers' })
  }

  const recipients = caretakers.map(c => c.email).filter(Boolean) as string[]
  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no caretaker emails' })
  }

  const guest = (reservation.profiles as unknown as { display_name?: string } | null)?.display_name || 'Someone'
  const start = format(parseISO(reservation.start_date), 'EEE, MMM d, yyyy')
  const end = format(parseISO(reservation.end_date), 'EEE, MMM d, yyyy')
  const subject = `Lake Wyandock: ${guest} booked ${start} → ${end}`
  const appUrl = process.env.APP_URL || 'https://lake.wyandock.com'

  const text = [
    `New reservation at Lake Wyandock:`,
    ``,
    `Guest: ${guest}`,
    `Arrives: ${start}`,
    `Departs: ${end}`,
    reservation.notes ? `Notes: ${reservation.notes}` : null,
    ``,
    `View the full calendar: ${appUrl}/calendar`,
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1E3A5F;">
      <h2 style="color: #1E3A5F; margin-top: 0;">New Reservation at Lake Wyandock</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #666;">Guest</td><td style="padding: 8px 0;"><strong>${escapeHtml(guest)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Arrives</td><td style="padding: 8px 0;">${start}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Departs</td><td style="padding: 8px 0;">${end}</td></tr>
        ${reservation.notes ? `<tr><td style="padding: 8px 0; color: #666; vertical-align: top;">Notes</td><td style="padding: 8px 0;">${escapeHtml(reservation.notes)}</td></tr>` : ''}
      </table>
      <p style="margin-top: 24px;">
        <a href="${appUrl}/calendar" style="background: #1E3A5F; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">View Calendar</a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        You're receiving this because you're a caretaker for Lake Wyandock.
      </p>
    </div>
  `.trim()

  try {
    await sendEmail({ to: recipients, subject, text, html })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Email send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notified: recipients })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
