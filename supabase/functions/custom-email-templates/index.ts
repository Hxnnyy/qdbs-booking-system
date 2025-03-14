
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML Template for our branded emails
const getEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Playfair Display', serif;
      margin: 0;
      padding: 0;
      background-color: #f8f8f8;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-header {
      background-color: #800020; /* Burgundy */
      padding: 24px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: 400;
    }
    .email-body {
      background-color: white;
      padding: 30px;
      border: 1px solid #e9e9e9;
    }
    .email-footer {
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #800020; /* Burgundy */
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 0;
      margin: 20px 0;
      font-weight: bold;
    }
    .code-container {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: center;
      font-size: 24px;
      letter-spacing: 4px;
      border: 1px solid #e0e0e0;
      font-family: monospace;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Queens Dock Barbershop</h1>
    </div>
    <div class="email-body">
      <h2>${title}</h2>
      ${content}
    </div>
    <div class="email-footer">
      &copy; ${new Date().getFullYear()} Queens Dock Barbershop. All rights reserved.<br>
      123 Queen's Dock, Liverpool, UK
    </div>
  </div>
</body>
</html>
`;

// Email templates for different authentication scenarios
const templates = {
  invite: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>You've been invited to join Queens Dock Barbershop. Click the button below to accept the invitation and create your account.</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Accept Invitation</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><small>${params.link}</small></p>
    `;
    return getEmailTemplate("You're Invited", content);
  },
  
  confirm: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>Thank you for signing up with Queens Dock Barbershop. Please confirm your email address by clicking the button below.</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Confirm Email Address</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><small>${params.link}</small></p>
    `;
    return getEmailTemplate("Confirm Your Email Address", content);
  },
  
  reset: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Reset Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><small>${params.link}</small></p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `;
    return getEmailTemplate("Reset Your Password", content);
  },
  
  magic_link: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>Click the button below to sign in to your Queens Dock Barbershop account.</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Sign In</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><small>${params.link}</small></p>
      <p>If you didn't request this link, you can safely ignore this email.</p>
    `;
    return getEmailTemplate("Your Sign-In Link", content);
  },
  
  email_change_old: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>We received a request to change the email associated with your Queens Dock Barbershop account.</p>
      <p>If this was you, no action is required. If you didn't request this change, please contact us immediately.</p>
    `;
    return getEmailTemplate("Email Change Notification", content);
  },
  
  email_change_new: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>Please confirm your new email address by clicking the button below.</p>
      <div style="text-align: center;">
        <a href="${params.link}" class="button">Confirm New Email</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><small>${params.link}</small></p>
    `;
    return getEmailTemplate("Confirm Your New Email", content);
  },
  
  sms_otp: (params: any) => {
    const content = `
      <p>Hello,</p>
      <p>Your verification code for Queens Dock Barbershop is:</p>
      <div class="code-container">${params.otp}</div>
      <p>This code will expire in 10 minutes.</p>
    `;
    return getEmailTemplate("Your Verification Code", content);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, ...params } = await req.json();
    
    if (!type || !templates[type]) {
      throw new Error('Invalid template type');
    }
    
    const html = templates[type](params);
    
    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error generating email template:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while generating the email template' 
      }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);
