import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  user_id: string;
  email: string;
  title: string;
  message: string;
  type: string;
  booking_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, title, message, type, booking_id }: EmailNotificationRequest = await req.json();

    console.log('Sending email notification:', { user_id, email, title, type, booking_id });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check user's email notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('email_enabled, quiet_hours_start, quiet_hours_end')
      .eq('user_id', user_id)
      .single();

    if (!preferences?.email_enabled) {
      console.log('Email notifications disabled for user:', user_id);
      return new Response(
        JSON.stringify({ message: 'Email notifications disabled for user' }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);
    
    if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const quietStart = preferences.quiet_hours_start;
      const quietEnd = preferences.quiet_hours_end;
      
      // Simple quiet hours check (doesn't handle midnight crossing for now)
      if (currentTime >= quietStart && currentTime <= quietEnd) {
        console.log('Within quiet hours, skipping email notification');
        return new Response(
          JSON.stringify({ message: 'Within quiet hours, email skipped' }), 
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Generate email content based on notification type
    let emailSubject = title;
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${title}</h1>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
        
        ${booking_id ? `
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${booking_id}</p>
            <p><a href="https://795aa452-ff26-4a5c-b5be-3c647e01e484.lovableproject.com/" 
                  style="color: #2563eb; text-decoration: none;">View Booking Details</a></p>
          </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 14px; color: #6b7280;">
          This email was sent from CleanerConnect. 
          <a href="https://795aa452-ff26-4a5c-b5be-3c647e01e484.lovableproject.com/" style="color: #2563eb;">
            Manage your notification preferences
          </a>
        </p>
      </div>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "CleanerConnect <noreply@resend.dev>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);