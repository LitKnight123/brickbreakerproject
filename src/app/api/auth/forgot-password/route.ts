import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
// Import fungsi/database kamu untuk nyari user, contoh:
// import { getUserByUsername } from '@/lib/users'; 

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username required' },
        { status: 400 }
      );
    }

    // 1. Cari user & email berdasarkan username
    // SESUAIKAN BARIS INI dengan cara kamu menyimpan data user:
    // const user = await getUserByUsername(username);
    //
    // Contoh dummy jika pakai mock/static data:
    // const targetEmail = user?.email;
    
    // Jika user tidak ditemukan, langsung kembalikan error
    /* 
    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, message: 'User with this username not found' },
        { status: 404 }
      );
    }
    */

    // Untuk simulasi lokal jika kamu belum ada fungsi query DB:
    const targetEmail = `${username}@example.com`; 

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 2. Buat random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // 3. Transporter Nodemailer (MailDev)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false,
    });

    // 4. Template Email
    const mailOptions = {
      from: '"Brick Breaker Pro" <noreply@localhost.com>',
      to: targetEmail,
      subject: 'Reset Password - Brick Breaker Pro',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
          <h2 style="color: #22d3ee; margin-bottom: 8px;">Brick Breaker Pro</h2>
          <h3 style="color: #e2e8f0; margin-top: 0;">Reset Password Request</h3>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
            Hi <strong>${username}</strong>, click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #0891b2; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 5. Set token & username ke Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Reset password link has been sent to your email.',
    });

    response.cookies.set('resetToken', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
    });

    response.cookies.set('resetUser', username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
    });

    return response;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email. Make sure MailDev is running.' },
      { status: 500 }
    );
  }
}