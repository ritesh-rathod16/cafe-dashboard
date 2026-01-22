import { Pool } from 'pg';
import { NextResponse } from 'next/server';

// Create a connection pool to PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function POST(request: Request) {
    let client;

    try {
        const body = await request.json();

        const { customer_name, phone_number, guest_count, booking_date, booking_time, special_request } = body;

        // Validate required fields
        if (!customer_name || !phone_number || !guest_count || !booking_date || !booking_time) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get a client from the pool
        client = await pool.connect();

        // Direct SQL INSERT - bypasses all Supabase API layers
        const query = `
      INSERT INTO public.table_bookings (
        customer_name,
        phone_number,
        guest_count,
        booking_date,
        booking_time,
        special_request,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;

        const values = [
            customer_name,
            phone_number,
            guest_count,
            booking_date,
            booking_time,
            special_request || null,
            'pending'
        ];

        const result = await client.query(query, values);

        return NextResponse.json(
            { data: result.rows[0], message: 'Booking created successfully' },
            { status: 201 }
        );

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create booking',
                details: error
            },
            { status: 500 }
        );
    } finally {
        // Release the client back to the pool
        if (client) {
            client.release();
        }
    }
}

export async function GET() {
    let client;

    try {
        client = await pool.connect();

        const query = `
      SELECT * FROM public.table_bookings
      ORDER BY created_at DESC;
    `;

        const result = await client.query(query);

        return NextResponse.json(
            { data: result.rows },
            { status: 200 }
        );

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    } finally {
        if (client) {
            client.release();
        }
    }
}

// sync: 2026-01-23 00:35:39
