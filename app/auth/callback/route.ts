import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
  let originUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`
  originUrl = originUrl.endsWith('/') ? originUrl.slice(0, -1) : originUrl

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${originUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${originUrl}/login?error=An%20error%20occurred%20while%20validating%20the%20link`)
}
