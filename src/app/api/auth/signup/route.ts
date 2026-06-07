import { NextRequest, NextResponse } from 'next/server'
import pg from 'pg'

const { Client } = pg

const passwordEncoded = encodeURIComponent('padmavathi@2028')
const connectionString = `postgresql://postgres.vdtzuzshdlqabtqdeelx:${passwordEncoded}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Connect to PG
    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
    })

    await client.connect()

    // 1. Check if user already exists
    const checkRes = await client.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    )

    if (checkRes.rows.length > 0) {
      await client.end()
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // 2. Insert user directly into auth.users with bcrypt encryption using pgcrypto extension
    const insertSql = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        $3::jsonb,
        false,
        now(),
        now()
      ) RETURNING id;
    `

    const res = await client.query(insertSql, [
      email,
      password,
      JSON.stringify({ full_name: name }),
    ])

    await client.end()

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      userId: res.rows[0].id,
    })

  } catch (err: any) {
    console.error('Direct signup database query error:', err)
    return NextResponse.json(
      { error: err.message || 'Database error occurred during registration.' },
      { status: 500 }
    )
  }
}
